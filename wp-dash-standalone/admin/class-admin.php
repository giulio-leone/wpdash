<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Admin {

    private string $menu_slug = 'wp-dash-sa';

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
    }

    public function register_menus(): void {
        add_menu_page(
            __( 'WP Dash', 'wp-dash-sa' ),
            __( 'WP Dash', 'wp-dash-sa' ),
            'manage_options',
            $this->menu_slug,
            [ $this, 'render_dashboard' ],
            'dashicons-dashboard',
            3
        );

        // First sub-menu uses same slug as parent — gives it an "Overview" label
        add_submenu_page(
            $this->menu_slug,
            __( 'Overview', 'wp-dash-sa' ),
            __( 'Overview', 'wp-dash-sa' ),
            'manage_options',
            $this->menu_slug,
            [ $this, 'render_dashboard' ]
        );

        $sub_pages = [
            [ 'slug' => 'wp-dash-sa-plugins',     'title' => 'Plugins',     'cb' => 'render_plugins' ],
            [ 'slug' => 'wp-dash-sa-themes',      'title' => 'Themes',      'cb' => 'render_themes' ],
            [ 'slug' => 'wp-dash-sa-users',       'title' => 'Users',       'cb' => 'render_users' ],
            [ 'slug' => 'wp-dash-sa-content',     'title' => 'Content',     'cb' => 'render_content' ],
            [ 'slug' => 'wp-dash-sa-database',    'title' => 'Database',    'cb' => 'render_database' ],
            [ 'slug' => 'wp-dash-sa-security',    'title' => 'Security',    'cb' => 'render_security' ],
            [ 'slug' => 'wp-dash-sa-seo',         'title' => 'SEO',         'cb' => 'render_seo' ],
            [ 'slug' => 'wp-dash-sa-logs',        'title' => 'Logs',        'cb' => 'render_logs' ],
            [ 'slug' => 'wp-dash-sa-backup',      'title' => 'Backup',      'cb' => 'render_backup' ],
            [ 'slug' => 'wp-dash-sa-woocommerce', 'title' => 'WooCommerce', 'cb' => 'render_woocommerce' ],
            [ 'slug' => 'wp-dash-sa-settings',    'title' => 'Settings',    'cb' => 'render_settings' ],
        ];

        foreach ( $sub_pages as $page ) {
            add_submenu_page(
                $this->menu_slug,
                __( $page['title'], 'wp-dash-sa' ),
                __( $page['title'], 'wp-dash-sa' ),
                'manage_options',
                $page['slug'],
                [ $this, $page['cb'] ]
            );
        }
    }

    public function enqueue_assets( string $hook ): void {
        $plugin_hooks = [
            'toplevel_page_wp-dash-sa',
            'wp-dash_page_wp-dash-sa-plugins',
            'wp-dash_page_wp-dash-sa-themes',
            'wp-dash_page_wp-dash-sa-users',
            'wp-dash_page_wp-dash-sa-content',
            'wp-dash_page_wp-dash-sa-database',
            'wp-dash_page_wp-dash-sa-security',
            'wp-dash_page_wp-dash-sa-seo',
            'wp-dash_page_wp-dash-sa-logs',
            'wp-dash_page_wp-dash-sa-backup',
            'wp-dash_page_wp-dash-sa-woocommerce',
            'wp-dash_page_wp-dash-sa-settings',
        ];

        if ( ! in_array( $hook, $plugin_hooks, true ) ) {
            return;
        }

        wp_enqueue_style(
            'wpdash-sa-css',
            WPDASH_SA_URL . 'assets/css/admin.css',
            [],
            WPDASH_SA_VERSION
        );

        wp_enqueue_script(
            'wpdash-sa-js',
            WPDASH_SA_URL . 'assets/js/admin.js',
            [],
            WPDASH_SA_VERSION,
            true
        );

        wp_localize_script( 'wpdash-sa-js', 'wpdash_sa', [
            'ajax_url'    => admin_url( 'admin-ajax.php' ),
            'nonce'       => wp_create_nonce( 'wpdash_sa_nonce' ),
            'active_site' => WPDash_SA_Sites_Manager::get_active_site_id() ?? '',
        ] );
    }

    // -------------------------------------------------------------------------
    // View renderers — each delegates to render_page()
    // -------------------------------------------------------------------------

    public function render_dashboard(): void   { $this->render_page( 'dashboard' ); }
    public function render_plugins(): void     { $this->render_page( 'plugins' ); }
    public function render_themes(): void      { $this->render_page( 'themes' ); }
    public function render_users(): void       { $this->render_page( 'users' ); }
    public function render_content(): void     { $this->render_page( 'content' ); }
    public function render_database(): void    { $this->render_page( 'database' ); }
    public function render_security(): void    { $this->render_page( 'security' ); }
    public function render_seo(): void         { $this->render_page( 'seo' ); }
    public function render_logs(): void        { $this->render_page( 'logs' ); }
    public function render_backup(): void      { $this->render_page( 'backup' ); }
    public function render_woocommerce(): void { $this->render_page( 'woocommerce' ); }

    public function render_settings(): void {
        $sites       = WPDash_SA_Sites_Manager::get_sites();
        $active_id   = WPDash_SA_Sites_Manager::get_active_site_id();
        $active_site = $active_id ? WPDash_SA_Sites_Manager::get_site( $active_id ) : null;
        include WPDASH_SA_PATH . 'admin/views/settings.php';
    }

    // -------------------------------------------------------------------------
    // Core page renderer
    // -------------------------------------------------------------------------

    public function render_page( string $view ): void {
        $sites = WPDash_SA_Sites_Manager::get_sites();

        if ( empty( $sites ) ) {
            include WPDASH_SA_PATH . 'admin/views/no-sites.php';
            return;
        }

        $active_id = WPDash_SA_Sites_Manager::get_active_site_id();
        $client    = WPDash_SA_Sites_Manager::get_bridge_client( $active_id );

        if ( ! $client ) {
            $first     = array_key_first( $sites );
            WPDash_SA_Sites_Manager::set_active_site( $first );
            $client    = WPDash_SA_Sites_Manager::get_bridge_client( $first );
            $active_id = $first;
        }

        $data        = $this->get_data_for_view( $view, $client );
        $active_site = WPDash_SA_Sites_Manager::get_site( $active_id );

        // Check for bridge connection error
        if ( isset( $data['error'] ) ) {
            $error_msg = $data['error'];
            include WPDASH_SA_PATH . 'admin/views/_bridge-error.php';
            return;
        }

        // Database view needs $data (tables) and $counts (cleanup) as separate vars
        $counts = [];
        if ( $view === 'database' ) {
            $counts = $data['cleanup'] ?? [];
            $data   = $data['tables'] ?? [];
        }

        include WPDASH_SA_PATH . 'admin/views/_site-switcher.php';
        include WPDASH_SA_PATH . "admin/views/{$view}.php";
    }

    private function get_data_for_view( string $view, WPDash_SA_Bridge_Client $client ) {
        switch ( $view ) {
            case 'dashboard':   return $client->get_health();
            case 'plugins':     return $client->get_plugins();
            case 'themes':      return $client->get_themes();
            case 'users':       return $client->get_users();
            case 'content':     return $client->get_content();
            case 'database':    return $client->get_database();
            case 'security':    return [];  // AJAX-driven
            case 'seo':         return [];  // AJAX-driven
            case 'logs':        return $client->get_logs();
            case 'backup':      return $client->get_backup();
            case 'woocommerce': return $client->get_woo_stats();
            default:            return [];
        }
    }
}

