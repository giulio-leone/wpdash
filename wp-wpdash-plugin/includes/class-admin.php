<?php
/**
 * Admin menu registration and asset enqueueing.
 */

defined( 'ABSPATH' ) || exit;

class WP_Dash_Admin {

    private static $instance = null;

    public static function get_instance(): self {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'admin_menu', [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
    }

    public function register_menus(): void {
        add_menu_page(
            __( 'WP Dash', 'wp-dash' ),
            __( 'WP Dash', 'wp-dash' ),
            'manage_options',
            'wp-dash',
            [ $this, 'render_app' ],
            'dashicons-admin-multisite',
            3
        );

        $submenus = [
            'dashboard' => __( 'Dashboard', 'wp-dash' ),
            'sites'     => __( 'Sites', 'wp-dash' ),
            'plugins'   => __( 'Plugins', 'wp-dash' ),
            'updates'   => __( 'Updates', 'wp-dash' ),
            'security'  => __( 'Security', 'wp-dash' ),
            'settings'  => __( 'Settings', 'wp-dash' ),
        ];

        foreach ( $submenus as $slug => $label ) {
            $menu_slug = ( 'dashboard' === $slug ) ? 'wp-dash' : 'wp-dash#' . $slug;
            add_submenu_page(
                'wp-dash',
                $label,
                $label,
                'manage_options',
                $menu_slug,
                [ $this, 'render_app' ]
            );
        }
    }

    public function enqueue_assets( string $hook_suffix ): void {
        // Only load on WP Dash admin pages.
        if ( strpos( $hook_suffix, 'wp-dash' ) === false ) {
            return;
        }

        $build_dir = WP_DASH_PLUGIN_DIR . 'build/';
        $build_url = WP_DASH_PLUGIN_URL . 'build/';

        $asset_file = $build_dir . 'index.asset.php';
        $asset      = file_exists( $asset_file )
            ? require $asset_file
            : [ 'dependencies' => [], 'version' => WP_DASH_VERSION ];

        wp_enqueue_script(
            'wp-dash-admin',
            $build_url . 'index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        if ( file_exists( $build_dir . 'index.css' ) ) {
            wp_enqueue_style(
                'wp-dash-admin',
                $build_url . 'index.css',
                [ 'wp-components' ],
                $asset['version']
            );
        }

        // Also enqueue our custom admin stylesheet.
        wp_enqueue_style(
            'wp-dash-admin-css',
            WP_DASH_PLUGIN_URL . 'assets/css/admin.css',
            [],
            WP_DASH_VERSION
        );

        wp_localize_script(
            'wp-dash-admin',
            'wpDashData',
            [
                'nonce'    => wp_create_nonce( 'wp_rest' ),
                'restBase' => rest_url( 'wp-dash/v1' ),
                'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
                'siteUrl'  => get_site_url(),
                'adminUrl' => admin_url(),
                'version'  => WP_DASH_VERSION,
            ]
        );
    }

    public function render_app(): void {
        echo '<div id="wp-dash-root"></div>';
    }
}
