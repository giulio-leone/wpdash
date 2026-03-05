<?php
/**
 * Plugin Name: WP Dash Standalone
 * Plugin URI: https://wpdash.io
 * Description: Multi-site management dashboard — remotely manage any WordPress site via the wp-dash-bridge REST API.
 * Version: 2.0.0
 * Author: WP Dash
 * Requires at least: 5.6
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

define( 'WPDASH_SA_VERSION', '2.0.0' );
define( 'WPDASH_SA_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPDASH_SA_URL', plugin_dir_url( __FILE__ ) );

require_once WPDASH_SA_PATH . 'includes/class-bridge-client.php';
require_once WPDASH_SA_PATH . 'includes/class-sites-manager.php';
require_once WPDASH_SA_PATH . 'admin/class-admin.php';
require_once WPDASH_SA_PATH . 'admin/class-ajax.php';

add_action( 'plugins_loaded', function () {
    new WP_Dash_SA_Admin();
    new WP_Dash_SA_Ajax();
} );
