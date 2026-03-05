/**
 * Plugins.js – Manage plugins on a selected connected site.
 *
 * Improvements: accepts shared `sites` prop, adds "Install Plugin" section,
 * adds "Bulk Update All" button for sites with pending plugin updates.
 */
import { useState, useEffect } from '@wordpress/element';
import { Button, SelectControl, TextControl, Spinner, Notice } from '@wordpress/components';
import { apiGet, proxyGet, proxyPost } from '../../api';

export default function Plugins( { sites: sitesProp } ) {
	const [ sites, setSites ]               = useState( sitesProp ?? [] );
	const [ selectedSite, setSelectedSite ] = useState( '' );
	const [ plugins, setPlugins ]           = useState( [] );
	const [ loading, setLoading ]           = useState( false );
	const [ sitesLoading, setSitesLoading ] = useState( ! sitesProp );
	const [ error, setError ]               = useState( null );
	const [ notice, setNotice ]             = useState( null );
	const [ actionBusy, setActionBusy ]     = useState( null ); // plugin slug being actioned
	const [ installSlug, setInstallSlug ]   = useState( '' );
	const [ installing, setInstalling ]     = useState( false );

	// Load sites list on mount (skip if provided via prop).
	useEffect( () => {
		if ( sitesProp !== undefined ) {
			if ( sitesProp.length > 0 ) setSelectedSite( String( sitesProp[ 0 ].id ) );
			setSitesLoading( false );
			return;
		}
		apiGet( '/sites' )
			.then( ( data ) => {
				setSites( data );
				if ( data.length > 0 ) setSelectedSite( String( data[ 0 ].id ) );
			} )
			.catch( ( err ) => setError( err.message ) )
			.finally( () => setSitesLoading( false ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch plugins whenever selected site changes.
	useEffect( () => {
		if ( ! selectedSite ) return;
		setPlugins( [] );
		setLoading( true );
		setError( null );
		proxyGet( Number( selectedSite ), '/plugins' )
			.then( ( data ) => setPlugins( Array.isArray( data ) ? data : data.plugins ?? [] ) )
			.catch( ( err ) => setError( err.message ) )
			.finally( () => setLoading( false ) );
	}, [ selectedSite ] );

	function showNotice( msg ) {
		setNotice( msg );
		setTimeout( () => setNotice( null ), 4000 );
	}

	async function refreshPlugins() {
		const fresh = await proxyGet( Number( selectedSite ), '/plugins' );
		setPlugins( Array.isArray( fresh ) ? fresh : fresh.plugins ?? [] );
	}

	async function handleAction( slug, action ) {
		setActionBusy( slug + ':' + action );
		setError( null );
		try {
			await proxyPost( Number( selectedSite ), `/plugins/${ action }`, { slug } );
			showNotice( `Plugin "${ slug }" ${ action }d successfully.` );
			await refreshPlugins();
		} catch ( err ) {
			setError( err.message );
		} finally {
			setActionBusy( null );
		}
	}

	async function handleInstall() {
		const slug = installSlug.trim();
		if ( ! slug ) return;
		setInstalling( true );
		setError( null );
		try {
			await proxyPost( Number( selectedSite ), '/plugins/install', { slug } );
			showNotice( `Plugin "${ slug }" installed successfully.` );
			setInstallSlug( '' );
			await refreshPlugins();
		} catch ( err ) {
			setError( err.message );
		} finally {
			setInstalling( false );
		}
	}

	async function handleBulkUpdate() {
		const toUpdate = plugins.filter( ( p ) => p.has_update );
		if ( toUpdate.length === 0 ) return;
		setActionBusy( '__bulk__' );
		setError( null );
		let failed = 0;
		for ( const plugin of toUpdate ) {
			const slug = plugin.slug ?? plugin.plugin;
			try {
				await proxyPost( Number( selectedSite ), '/plugins/update', { slug } );
			} catch {
				failed++;
			}
		}
		showNotice(
			failed === 0
				? `All ${ toUpdate.length } plugin${ toUpdate.length !== 1 ? 's' : '' } updated.`
				: `Updated with ${ failed } error(s).`
		);
		await refreshPlugins();
		setActionBusy( null );
	}

	const siteOptions = sites.map( ( s ) => ( { label: s.name, value: String( s.id ) } ) );
	const updatableCount = plugins.filter( ( p ) => p.has_update ).length;

	if ( sitesLoading ) {
		return (
			<div className="wp-dash-loading">
				<Spinner />
				<span>Loading…</span>
			</div>
		);
	}

	return (
		<div>
			<div className="wp-dash-screen-header">
				<h2>Plugins</h2>
				<p>View and manage plugins on a connected site.</p>
			</div>

			{ notice && (
				<Notice status="success" isDismissible onRemove={ () => setNotice( null ) }>
					{ notice }
				</Notice>
			) }
			{ error && <div className="wp-dash-error">{ error }</div> }

			{ sites.length === 0 ? (
				<div className="wp-dash-empty">No sites connected. Add a site first.</div>
			) : (
				<>
					<div className="wp-dash-card" style={ { marginBottom: 20 } }>
						<SelectControl
							label="Select Site"
							value={ selectedSite }
							options={ siteOptions }
							onChange={ setSelectedSite }
						/>
					</div>

					{ /* Install Plugin */ }
					<div className="wp-dash-card" style={ { marginBottom: 20 } }>
						<h4 style={ { margin: '0 0 12px' } }>Install Plugin</h4>
						<div style={ { display: 'flex', gap: 10, alignItems: 'flex-end' } }>
							<div style={ { flex: 1 } }>
								<TextControl
									label="Plugin Slug"
									value={ installSlug }
									onChange={ setInstallSlug }
									placeholder="e.g. woocommerce"
									disabled={ installing }
								/>
							</div>
							<Button
								variant="primary"
								isBusy={ installing }
								disabled={ installing || ! installSlug.trim() }
								onClick={ handleInstall }
								style={ { marginBottom: 8 } }
							>
								Install
							</Button>
						</div>
					</div>

					{ loading ? (
						<div className="wp-dash-loading">
							<Spinner />
							<span>Loading plugins…</span>
						</div>
					) : plugins.length === 0 ? (
						<div className="wp-dash-empty">No plugins found for this site.</div>
					) : (
						<>
							{ updatableCount > 0 && (
								<div style={ { marginBottom: 12 } }>
									<Button
										variant="primary"
										isBusy={ actionBusy === '__bulk__' }
										disabled={ !! actionBusy }
										onClick={ handleBulkUpdate }
									>
										⬆ Bulk Update All ({ updatableCount })
									</Button>
								</div>
							) }

							<div className="wp-dash-table-wrap">
								<table className="wp-dash-table">
									<thead>
										<tr>
											<th>Plugin</th>
											<th>Version</th>
											<th>Status</th>
											<th>Update</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{ plugins.map( ( plugin ) => {
											const slug = plugin.slug ?? plugin.plugin;
											const busy = ( key ) => actionBusy === slug + ':' + key;
											return (
												<tr key={ slug }>
													<td>
														<strong>{ plugin.name }</strong>
														{ plugin.description && (
															<div style={ { fontSize: 11, color: '#646970', marginTop: 2 } }>
																{ plugin.description.substring( 0, 80 ) }{ plugin.description.length > 80 ? '…' : '' }
															</div>
														) }
													</td>
													<td>{ plugin.version ?? '—' }</td>
													<td>
														<span className={ `wp-dash-badge ${ plugin.status === 'active' ? 'active' : 'inactive' }` }>
															{ plugin.status === 'active' ? 'Active' : 'Inactive' }
														</span>
													</td>
													<td>
														{ plugin.has_update ? (
															<span className="wp-dash-badge warning">
																{ plugin.update_version ?? 'Available' }
															</span>
														) : (
															<span style={ { color: '#646970', fontSize: 12 } }>Up to date</span>
														) }
													</td>
													<td>
														<div className="actions">
															{ plugin.status !== 'active' && (
																<Button
																	variant="secondary"
																	size="small"
																	isBusy={ busy( 'activate' ) }
																	disabled={ !! actionBusy }
																	onClick={ () => handleAction( slug, 'activate' ) }
																>
																	Activate
																</Button>
															) }
															{ plugin.status === 'active' && (
																<Button
																	variant="secondary"
																	size="small"
																	isBusy={ busy( 'deactivate' ) }
																	disabled={ !! actionBusy }
																	onClick={ () => handleAction( slug, 'deactivate' ) }
																>
																	Deactivate
																</Button>
															) }
															{ plugin.has_update && (
																<Button
																	variant="primary"
																	size="small"
																	isBusy={ busy( 'update' ) }
																	disabled={ !! actionBusy }
																	onClick={ () => handleAction( slug, 'update' ) }
																>
																	Update
																</Button>
															) }
															<Button
																variant="secondary"
																isDestructive
																size="small"
																isBusy={ busy( 'delete' ) }
																disabled={ !! actionBusy }
																onClick={ () => {
																	if ( window.confirm( `Delete plugin "${ plugin.name }"?` ) ) {
																		handleAction( slug, 'delete' );
																	}
																} }
															>
																Delete
															</Button>
														</div>
													</td>
												</tr>
											);
										} ) }
									</tbody>
								</table>
							</div>
						</>
					) }
				</>
			) }
		</div>
	);
}
