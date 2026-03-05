<?php
/**
 * Plugin Name: WP Dash
 * Plugin URI: https://wpdash.io
 * Description: Centralized WordPress management hub. Manage all your WordPress sites from one dashboard.
 * Version: 1.0.0
 * Author: WP Dash
 * License: GPL v2 or later
 * Text Domain: wp-dash
 */

defined( 'ABSPATH' ) || exit;

define( 'WP_DASH_VERSION', '1.0.0' );
define( 'WP_DASH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WP_DASH_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once WP_DASH_PLUGIN_DIR . 'includes/class-bridge.php';
require_once WP_DASH_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once WP_DASH_PLUGIN_DIR . 'includes/class-admin.php';

register_activation_hook( __FILE__, 'wp_dash_activate' );

function wp_dash_activate() {
    global $wpdb;

    $table_name      = $wpdb->prefix . 'dash_sites';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
        id          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        name        VARCHAR(255)        NOT NULL DEFAULT '',
        url         VARCHAR(500)        NOT NULL DEFAULT '',
        token       TEXT                NOT NULL,
        created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) {$charset_collate};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

add_action( 'plugins_loaded', function () {
    WP_Dash_Admin::get_instance();
    WP_Dash_REST_API::get_instance();
} );
