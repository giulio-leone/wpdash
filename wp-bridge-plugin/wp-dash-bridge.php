<?php
/**
 * Plugin Name: WP Dash Bridge
 * Plugin URI: https://github.com/giulio-leone/wpdash
 * Description: Ultra-lightweight bridge plugin for WP Dash monitoring dashboard. Exposes REST API endpoints for remote site management.
 * Version: 1.0.0
 * Author: giulio-leone
 * License: GPL-2.0-or-later
 * Requires at least: 5.6
 * Requires PHP: 7.4
 * Text Domain: wp-dash-bridge
 */

if (!defined('ABSPATH')) exit;

define('WPDASH_BRIDGE_VERSION', '1.0.0');
define('WPDASH_BRIDGE_PATH', plugin_dir_path(__FILE__));
define('WPDASH_BRIDGE_URL', plugin_dir_url(__FILE__));

// Load dependencies
require_once WPDASH_BRIDGE_PATH . 'includes/class-auth.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-rate-limiter.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-health.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-plugins.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-security.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-seo.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-logs.php';
require_once WPDASH_BRIDGE_PATH . 'includes/class-backup.php';

// Admin page
if (is_admin()) {
    require_once WPDASH_BRIDGE_PATH . 'admin/class-admin-page.php';
    new WPDash_Admin_Page();
}

// Register REST routes on rest_api_init
add_action('rest_api_init', function () {
    $auth = new WPDash_Auth();
    $rate_limiter = new WPDash_Rate_Limiter();

    (new WPDash_Health($auth, $rate_limiter))->register_routes();
    (new WPDash_Plugins($auth, $rate_limiter))->register_routes();
    (new WPDash_Security($auth, $rate_limiter))->register_routes();
    (new WPDash_SEO($auth, $rate_limiter))->register_routes();
    (new WPDash_Logs($auth, $rate_limiter))->register_routes();
    (new WPDash_Backup($auth, $rate_limiter))->register_routes();
});

// Activation hook
register_activation_hook(__FILE__, function () {
    // Generate initial token on activation
    if (!get_option('wpdash_bridge_token_hash')) {
        $token = bin2hex(random_bytes(32));
        update_option('wpdash_bridge_token_hash', hash('sha256', $token));
        // Store temporarily so admin can see it once
        set_transient('wpdash_bridge_initial_token', $token, 300); // 5 min
    }
    update_option('wpdash_bridge_version', WPDASH_BRIDGE_VERSION);
});

// Deactivation hook
register_deactivation_hook(__FILE__, function () {
    delete_option('wpdash_bridge_token_hash');
    delete_option('wpdash_bridge_version');
    delete_transient('wpdash_bridge_initial_token');
    delete_transient('wpdash_bridge_rate_limit');
});
