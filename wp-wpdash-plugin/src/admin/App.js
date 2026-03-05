/**
 * App.js – Root component. Manages client-side routing via a simple
 * `currentScreen` state value; no router library needed.
 *
 * On mount: fetches all sites and stores them in shared state. Passes sites
 * and a badges object (update / security counts) down to child screens.
 */
import { useState, useEffect } from '@wordpress/element';
import { Spinner, Button } from '@wordpress/components';
import { apiGet } from './api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/screens/Dashboard';
import Sites from './components/screens/Sites';
import Plugins from './components/screens/Plugins';
import Updates from './components/screens/Updates';
import Security from './components/screens/Security';
import Settings from './components/screens/Settings';

const SCREENS = {
	dashboard: Dashboard,
	sites: Sites,
	plugins: Plugins,
	updates: Updates,
	security: Security,
	settings: Settings,
};

export default function App() {
	const [ currentScreen, setCurrentScreen ] = useState( 'dashboard' );
	const [ sites, setSites ]               = useState( [] );
	const [ sitesLoading, setSitesLoading ] = useState( true );
	const [ badges, setBadges ]             = useState( { updates: 0, security: 0 } );

	useEffect( () => {
		apiGet( '/sites' )
			.then( setSites )
			.catch( () => {} )
			.finally( () => setSitesLoading( false ) );
	}, [] );

	if ( sitesLoading ) {
		return (
			<div className="wp-dash-app">
				<Header />
				<div className="wp-dash-loading" style={ { justifyContent: 'center', height: '60vh' } }>
					<Spinner />
					<span>Loading WP Dash…</span>
				</div>
			</div>
		);
	}

	const ScreenComponent = SCREENS[ currentScreen ] ?? Dashboard;

	// When on dashboard with no sites connected, show an onboarding prompt.
	const showOnboarding = sites.length === 0 && currentScreen === 'dashboard';

	return (
		<div className="wp-dash-app">
			<Header />
			<div className="wp-dash-layout">
				<Sidebar
					currentScreen={ currentScreen }
					onNavigate={ setCurrentScreen }
					badges={ badges }
				/>
				<main className="wp-dash-main">
					{ showOnboarding ? (
						<div style={ { padding: 48, textAlign: 'center' } }>
							<span className="dashicons dashicons-admin-multisite" style={ { fontSize: 48, width: 48, height: 48, color: '#c3c4c7', marginBottom: 16 } } />
							<h2 style={ { marginTop: 16 } }>Welcome to WP Dash</h2>
							<p style={ { color: '#646970', marginBottom: 24 } }>
								No sites connected yet. Add your first site to get started.
							</p>
							<Button variant="primary" onClick={ () => setCurrentScreen( 'sites' ) }>
								Connect your first site →
							</Button>
						</div>
					) : (
						<ScreenComponent
							sites={ sites }
							onSitesChange={ setSites }
							onNavigate={ setCurrentScreen }
							onBadgesUpdate={ setBadges }
						/>
					) }
				</main>
			</div>
		</div>
	);
}
