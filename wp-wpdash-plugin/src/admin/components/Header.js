/**
 * Header.js – Top bar with plugin name and version badge.
 */
export default function Header() {
	return (
		<header className="wp-dash-header">
			<span className="dashicons dashicons-admin-multisite" />
			<h1>WP Dash</h1>
			<span className="version-badge">v{ window.wpDashData?.version ?? '1.0.0' }</span>
		</header>
	);
}
