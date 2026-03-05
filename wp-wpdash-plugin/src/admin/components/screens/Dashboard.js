/**
 * Dashboard.js – Overview of all connected sites with health status.
 */
import { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
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

export default function Dashboard() {
	const [ sites, setSites ]     = useState( [] );
	const [ healths, setHealths ] = useState( {} );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ]     = useState( null );

	useEffect( () => {
		let cancelled = false;

		async function fetchAll() {
			try {
				const sitesData = await apiGet( '/sites' );
				if ( cancelled ) return;
				setSites( sitesData );
				setLoading( false );

				// Fetch health for each site in parallel.
				const healthMap = {};
				await Promise.all(
					sitesData.map( async ( site ) => {
						try {
							const h = await proxyGet( site.id, '/health' );
							healthMap[ site.id ] = h;
						} catch ( err ) {
							healthMap[ site.id ] = { error: err.message };
						}
						if ( ! cancelled ) {
							setHealths( ( prev ) => ( { ...prev, [ site.id ]: healthMap[ site.id ] } ) );
						}
					} )
				);
			} catch ( err ) {
				if ( ! cancelled ) {
					setError( err.message );
					setLoading( false );
				}
			}
		}

		fetchAll();
		return () => { cancelled = true; };
	}, [] );

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
				<p>Overview of all connected WordPress sites.</p>
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
