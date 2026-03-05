/**
 * Updates.js – Aggregate update status across all connected sites.
 *
 * Improvements: accepts shared `sites` prop, adds a sequential
 * "Update All Sites" button that processes one site at a time.
 */
import { useState, useEffect } from '@wordpress/element';
import { Button, Spinner, Notice } from '@wordpress/components';
import { apiGet, proxyGet, proxyPost } from '../../api';

export default function Updates( { sites: sitesProp } ) {
	const [ rows, setRows ]             = useState( [] );
	const [ loading, setLoading ]       = useState( true );
	const [ error, setError ]           = useState( null );
	const [ notice, setNotice ]         = useState( null );
	const [ busySite, setBusySite ]     = useState( null );
	const [ bulkUpdating, setBulkUpdating ] = useState( false );
	const [ bulkProgress, setBulkProgress ] = useState( null );

	async function fetchUpdates( overrideSites ) {
		setLoading( true );
		setError( null );
		try {
			const sites = overrideSites ?? sitesProp ?? await apiGet( '/sites' );
			const results = await Promise.all(
				sites.map( async ( site ) => {
					try {
						const health = await proxyGet( site.id, '/health' );
						return {
							site,
							wp_update:      health.wp_update ?? false,
							plugin_updates: health.plugin_updates ?? 0,
							theme_updates:  health.theme_updates ?? 0,
							wp_version:     health.wp_version ?? '—',
							online:         true,
						};
					} catch {
						return {
							site,
							wp_update:      false,
							plugin_updates: 0,
							theme_updates:  0,
							wp_version:     '—',
							online:         false,
						};
					}
				} )
			);
			setRows( results );
		} catch ( err ) {
			setError( err.message );
		} finally {
			setLoading( false );
		}
	}

	useEffect( () => {
		fetchUpdates();
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	async function applyCoreUpdate( siteId, siteName ) {
		if ( ! window.confirm( `Apply WordPress core update on "${ siteName }"?` ) ) return;
		setBusySite( siteId );
		setError( null );
		try {
			await proxyPost( siteId, '/updates/core', {} );
			setNotice( `Core update applied on "${ siteName }".` );
			setTimeout( () => setNotice( null ), 5000 );
			await fetchUpdates();
		} catch ( err ) {
			setError( err.message );
		} finally {
			setBusySite( null );
		}
	}

	async function updateAllSites() {
		const sitesWithUpdates = rows.filter(
			( r ) => r.online && ( r.wp_update || r.plugin_updates > 0 )
		);
		if ( sitesWithUpdates.length === 0 ) return;
		if (
			! window.confirm(
				`Apply all available updates across ${ sitesWithUpdates.length } site(s)? This includes core and plugin updates.`
			)
		) return;

		setBulkUpdating( true );
		setError( null );
		let done = 0;

		for ( const row of sitesWithUpdates ) {
			setBulkProgress(
				`Updating ${ row.site.name } (${ done + 1 }/${ sitesWithUpdates.length })…`
			);
			try {
				if ( row.wp_update ) {
					await proxyPost( row.site.id, '/updates/core', {} );
				}
				if ( row.plugin_updates > 0 ) {
					await proxyPost( row.site.id, '/updates/plugins', {} );
				}
			} catch { /* continue to next site */ }
			done++;
		}

		setBulkProgress( null );
		setBulkUpdating( false );
		setNotice( `Bulk update complete across ${ done } site(s).` );
		setTimeout( () => setNotice( null ), 6000 );
		fetchUpdates();
	}

	if ( loading ) {
		return (
			<div className="wp-dash-loading">
				<Spinner />
				<span>Checking updates across all sites…</span>
			</div>
		);
	}

	const totalCoreUpdates   = rows.filter( ( r ) => r.wp_update ).length;
	const totalPluginUpdates = rows.reduce( ( sum, r ) => sum + r.plugin_updates, 0 );
	const totalThemeUpdates  = rows.reduce( ( sum, r ) => sum + r.theme_updates, 0 );
	const sitesNeedingUpdates = rows.filter( ( r ) => r.online && ( r.wp_update || r.plugin_updates > 0 ) ).length;

	return (
		<div>
			<div className="wp-dash-screen-header">
				<h2>Updates</h2>
				<p>Monitor and apply updates across all connected sites.</p>
			</div>

			{ notice && (
				<Notice status="success" isDismissible onRemove={ () => setNotice( null ) }>
					{ notice }
				</Notice>
			) }
			{ error && <div className="wp-dash-error">{ error }</div> }

			{ /* Summary cards */ }
			<div className="wp-dash-summary-row" style={ { marginBottom: 20 } }>
				<div className="wp-dash-stat-card">
					<div className="stat-value">{ rows.length }</div>
					<div className="stat-label">Total Sites</div>
				</div>
				<div className={ `wp-dash-stat-card ${ sitesNeedingUpdates > 0 ? 'has-updates' : '' }` }>
					<div className="stat-value">{ sitesNeedingUpdates }</div>
					<div className="stat-label">Sites with Updates</div>
				</div>
				<div className={ `wp-dash-stat-card ${ totalCoreUpdates > 0 ? 'has-updates' : '' }` }>
					<div className="stat-value">{ totalCoreUpdates }</div>
					<div className="stat-label">Core Updates</div>
				</div>
				<div className={ `wp-dash-stat-card ${ totalPluginUpdates > 0 ? 'has-updates' : '' }` }>
					<div className="stat-value">{ totalPluginUpdates }</div>
					<div className="stat-label">Plugin Updates</div>
				</div>
				<div className={ `wp-dash-stat-card ${ totalThemeUpdates > 0 ? 'has-updates' : '' }` }>
					<div className="stat-value">{ totalThemeUpdates }</div>
					<div className="stat-label">Theme Updates</div>
				</div>
			</div>

			<div style={ { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' } }>
				<Button
					variant="secondary"
					onClick={ () => fetchUpdates() }
					disabled={ loading || bulkUpdating }
				>
					↻ Refresh
				</Button>
				{ sitesNeedingUpdates > 0 && (
					<Button
						variant="primary"
						isBusy={ bulkUpdating }
						disabled={ bulkUpdating || !! busySite }
						onClick={ updateAllSites }
					>
						⬆ Update All Sites ({ sitesNeedingUpdates })
					</Button>
				) }
				{ bulkProgress && (
					<span style={ { fontSize: 13, color: '#646970' } }>{ bulkProgress }</span>
				) }
			</div>

			{ rows.length === 0 ? (
				<div className="wp-dash-empty">No sites connected.</div>
			) : (
				<div className="wp-dash-table-wrap">
					<table className="wp-dash-table">
						<thead>
							<tr>
								<th>Site</th>
								<th>Status</th>
								<th>WP Version</th>
								<th>Core Update</th>
								<th>Plugin Updates</th>
								<th>Theme Updates</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ rows.map( ( { site, online, wp_version, wp_update, plugin_updates, theme_updates } ) => (
								<tr key={ site.id }>
									<td><strong>{ site.name }</strong></td>
									<td>
										<span className={ `wp-dash-badge ${ online ? 'online' : 'offline' }` }>
											{ online ? 'Online' : 'Offline' }
										</span>
									</td>
									<td>{ wp_version }</td>
									<td>
										{ wp_update ? (
											<span className="wp-dash-badge warning">Available</span>
										) : (
											<span style={ { color: '#1a7f37', fontSize: 12 } }>✓ Current</span>
										) }
									</td>
									<td>
										{ plugin_updates > 0 ? (
											<span className="wp-dash-badge warning">{ plugin_updates }</span>
										) : (
											<span style={ { color: '#1a7f37', fontSize: 12 } }>✓ 0</span>
										) }
									</td>
									<td>
										{ theme_updates > 0 ? (
											<span className="wp-dash-badge warning">{ theme_updates }</span>
										) : (
											<span style={ { color: '#1a7f37', fontSize: 12 } }>✓ 0</span>
										) }
									</td>
									<td>
										{ wp_update && online && (
											<Button
												variant="primary"
												size="small"
												isBusy={ busySite === site.id }
												disabled={ busySite !== null || bulkUpdating }
												onClick={ () => applyCoreUpdate( site.id, site.name ) }
											>
												Apply Core Update
											</Button>
										) }
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</div>
			) }
		</div>
	);
}
