/**
 * Dashboard.js – Overview of all connected sites with health status.
 *
 * Accepts an optional `sites` prop from App.js (shared state). Falls back to
 * fetching on its own if not provided. Health is fetched in parallel for all
 * sites. Calls `onBadgesUpdate` with {updates, security} counts when done.
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { Spinner, Button } from '@wordpress/components';
import { apiGet, proxyGet } from '../../api';

function StatCard( { value, label, className = '' } ) {
	return (
		<div className={ `wp-dash-stat-card ${ className }` }>
			<div className="stat-value">{ value }</div>
			<div className="stat-label">{ label }</div>
		</div>
	);
}

function SiteCard( { site, health, loading } ) {
	const isOnline = ! loading && health && ! health.error;

	return (
		<div className="wp-dash-site-card">
			<div className="site-card-header">
				<span className="site-name">{ site.name }</span>
				{ loading ? (
					<Spinner />
				) : (
					<span className={ `wp-dash-badge ${ isOnline ? 'online' : 'offline' }` }>
						{ isOnline ? 'Online' : 'Offline' }
					</span>
				) }
			</div>
			<div className="site-url">{ site.url }</div>
			{ isOnline && (
				<div className="site-meta">
					{ health.wp_version && (
						<span>WP { health.wp_version }</span>
					) }
					{ health.php_version && (
						<span>PHP { health.php_version }</span>
					) }
					{ health.plugin_updates > 0 && (
						<span style={ { background: '#fef8ee', color: '#dba617' } }>
							{ health.plugin_updates } plugin update{ health.plugin_updates !== 1 ? 's' : '' }
						</span>
					) }
					{ health.has_security_issues && (
						<span style={ { background: '#fce8e8', color: '#d63638' } }>
							Security issues
						</span>
					) }
				</div>
			) }
			{ ! loading && ! isOnline && (
				<div style={ { fontSize: 12, color: '#d63638', marginTop: 8 } }>
					{ health?.error ?? 'Could not connect to site.' }
				</div>
			) }
		</div>
	);
}

export default function Dashboard( { sites: sitesProp, onBadgesUpdate } ) {
	const [ sites, setSites ]           = useState( sitesProp ?? [] );
	const [ healths, setHealths ]       = useState( {} );
	const [ loading, setLoading ]       = useState( ! sitesProp );
	const [ refreshing, setRefreshing ] = useState( false );
	const [ error, setError ]           = useState( null );
	const [ lastChecked, setLastChecked ] = useState( null );

	const fetchHealths = useCallback( async ( siteList ) => {
		setHealths( {} );
		setError( null );
		const healthMap = {};
		await Promise.all(
			siteList.map( async ( site ) => {
				try {
					const h = await proxyGet( site.id, '/health' );
					healthMap[ site.id ] = h;
				} catch ( err ) {
					healthMap[ site.id ] = { error: err.message };
				}
				setHealths( ( prev ) => ( { ...prev, [ site.id ]: healthMap[ site.id ] } ) );
			} )
		);
		setLastChecked( new Date() );
		// Update sidebar badges after all health data is in.
		if ( onBadgesUpdate ) {
			const updatesCount = siteList.filter( ( s ) => healthMap[ s.id ]?.plugin_updates > 0 ).length;
			const secCount     = siteList.filter( ( s ) => healthMap[ s.id ]?.has_security_issues ).length;
			onBadgesUpdate( { updates: updatesCount, security: secCount } );
		}
		return healthMap;
	}, [ onBadgesUpdate ] );

	// Initial load: use prop sites or fetch from API.
	useEffect( () => {
		let cancelled = false;

		async function init() {
			try {
				let siteList = sitesProp;
				if ( ! siteList ) {
					siteList = await apiGet( '/sites' );
					if ( cancelled ) return;
					setSites( siteList );
				}
				setLoading( false );
				await fetchHealths( siteList );
			} catch ( err ) {
				if ( ! cancelled ) {
					setError( err.message );
					setLoading( false );
				}
			}
		}

		init();
		return () => { cancelled = true; };
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	async function handleRefresh() {
		setRefreshing( true );
		await fetchHealths( sites ).catch( ( err ) => setError( err.message ) );
		setRefreshing( false );
	}

	if ( loading ) {
		return (
			<div className="wp-dash-loading">
				<Spinner />
				<span>Loading sites…</span>
			</div>
		);
	}

	if ( error ) {
		return <div className="wp-dash-error">{ error }</div>;
	}

	const onlineCount  = sites.filter( ( s ) => healths[ s.id ] && ! healths[ s.id ].error ).length;
	const updatesCount = sites.filter( ( s ) => healths[ s.id ]?.plugin_updates > 0 ).length;
	const secCount     = sites.filter( ( s ) => healths[ s.id ]?.has_security_issues ).length;

	return (
		<div>
			<div className="wp-dash-screen-header">
				<h2>Dashboard</h2>
				<div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
					<p style={ { margin: 0 } }>Overview of all connected WordPress sites.</p>
					{ lastChecked && (
						<span style={ { fontSize: 11, color: '#646970' } }>
							Last checked: { lastChecked.toLocaleTimeString() }
						</span>
					) }
					<Button
						variant="secondary"
						size="small"
						isBusy={ refreshing }
						disabled={ refreshing }
						onClick={ handleRefresh }
					>
						↻ Refresh
					</Button>
				</div>
			</div>

			<div className="wp-dash-summary-row">
				<StatCard value={ sites.length } label="Total Sites" />
				<StatCard value={ onlineCount }  label="Online" />
				<StatCard
					value={ updatesCount }
					label="Sites with Updates"
					className={ updatesCount > 0 ? 'has-updates' : '' }
				/>
				<StatCard
					value={ secCount }
					label="Security Issues"
					className={ secCount > 0 ? 'has-issues' : '' }
				/>
			</div>

			{ sites.length === 0 ? (
				<div className="wp-dash-empty">
					No sites connected yet. Go to <strong>Sites</strong> to add your first site.
				</div>
			) : (
				<div className="wp-dash-sites-grid">
					{ sites.map( ( site ) => (
						<SiteCard
							key={ site.id }
							site={ site }
							health={ healths[ site.id ] }
							loading={ ! ( site.id in healths ) }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}
