/**
 * App.js – Root component. Manages client-side routing via a simple
 * `currentScreen` state value; no router library needed.
 */
import { useState } from '@wordpress/element';
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

	const ScreenComponent = SCREENS[ currentScreen ] ?? Dashboard;

	return (
		<div className="wp-dash-app">
			<Header />
			<div className="wp-dash-layout">
				<Sidebar
					currentScreen={ currentScreen }
					onNavigate={ setCurrentScreen }
				/>
				<main className="wp-dash-main">
					<ScreenComponent onNavigate={ setCurrentScreen } />
				</main>
			</div>
		</div>
	);
}
