/**
 * Sidebar.js – Navigation sidebar with optional notification badges.
 */

const NAV_ITEMS = [
	{ id: 'dashboard', label: 'Dashboard', icon: 'dashicons-dashboard' },
	{ id: 'sites',     label: 'Sites',     icon: 'dashicons-admin-multisite' },
	{ id: 'plugins',   label: 'Plugins',   icon: 'dashicons-admin-plugins' },
	{ id: 'updates',   label: 'Updates',   icon: 'dashicons-update' },
	{ id: 'security',  label: 'Security',  icon: 'dashicons-shield' },
	{ id: 'settings',  label: 'Settings',  icon: 'dashicons-admin-settings' },
];

export default function Sidebar( { currentScreen, onNavigate, badges = {} } ) {
	return (
		<aside className="wp-dash-sidebar">
			<nav>
				<ul>
					{ NAV_ITEMS.map( ( item ) => {
						const badgeCount =
							item.id === 'updates'  ? ( badges.updates  ?? 0 ) :
							item.id === 'security' ? ( badges.security ?? 0 ) :
							0;

						return (
							<li key={ item.id }>
								<button
									className={ currentScreen === item.id ? 'active' : '' }
									onClick={ () => onNavigate( item.id ) }
								>
									<span className={ `dashicons ${ item.icon }` } />
									{ item.label }
									{ badgeCount > 0 && (
										<span className="wp-dash-nav-badge">{ badgeCount }</span>
									) }
								</button>
							</li>
						);
					} ) }
				</ul>
			</nav>
		</aside>
	);
}
