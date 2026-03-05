/**
 * Sidebar.js – Navigation sidebar.
 */

const NAV_ITEMS = [
	{ id: 'dashboard', label: 'Dashboard', icon: 'dashicons-dashboard' },
	{ id: 'sites',     label: 'Sites',     icon: 'dashicons-admin-multisite' },
	{ id: 'plugins',   label: 'Plugins',   icon: 'dashicons-admin-plugins' },
	{ id: 'updates',   label: 'Updates',   icon: 'dashicons-update' },
	{ id: 'security',  label: 'Security',  icon: 'dashicons-shield' },
	{ id: 'settings',  label: 'Settings',  icon: 'dashicons-admin-settings' },
];

export default function Sidebar( { currentScreen, onNavigate } ) {
	return (
		<aside className="wp-dash-sidebar">
			<nav>
				<ul>
					{ NAV_ITEMS.map( ( item ) => (
						<li key={ item.id }>
							<button
								className={ currentScreen === item.id ? 'active' : '' }
								onClick={ () => onNavigate( item.id ) }
							>
								<span className={ `dashicons ${ item.icon }` } />
								{ item.label }
							</button>
						</li>
					) ) }
				</ul>
			</nav>
		</aside>
	);
}
