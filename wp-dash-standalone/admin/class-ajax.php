<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Ajax {

    public function __construct() {
        $actions = [
            'wpdash_sa_get_plugins',
            'wpdash_sa_plugin_action',
            'wpdash_sa_install_plugin',
            'wpdash_sa_get_themes',
            'wpdash_sa_theme_action',
            'wpdash_sa_get_users',
            'wpdash_sa_user_action',
            'wpdash_sa_get_content',
            'wpdash_sa_content_action',
            'wpdash_sa_get_database',
            'wpdash_sa_database_action',
            'wpdash_sa_get_security',
            'wpdash_sa_get_seo',
            'wpdash_sa_get_logs',
            'wpdash_sa_clear_logs',
            'wpdash_sa_get_backup',
            'wpdash_sa_get_health',
            'wpdash_sa_get_woocommerce',
            'wpdash_sa_add_site',
            'wpdash_sa_remove_site',
            'wpdash_sa_switch_site',
            'wpdash_sa_test_connection',
        ];

        foreach ( $actions as $action ) {
            $method = 'handle_' . str_replace( 'wpdash_sa_', '', $action );
            add_action( 'wp_ajax_' . $action, [ $this, $method ] );
        }
    }

    private function verify(): void {
        check_ajax_referer( 'wpdash_sa_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorized', 403 );
        }
    }

    private function get_client(): ?WPDash_SA_Bridge_Client {
        return WPDash_SA_Sites_Manager::get_bridge_client();
    }

    private function require_client(): WPDash_SA_Bridge_Client {
        $client = $this->get_client();
        if ( ! $client ) {
            wp_send_json_error( 'No active site configured. Add a site in WP Dash → Settings.' );
            exit;
        }
        return $client;
    }

    // -------------------------------------------------------------------------
    // Site management
    // -------------------------------------------------------------------------

    public function handle_add_site(): void {
        $this->verify();
        $name  = sanitize_text_field( $_POST['name'] ?? '' );
        $url   = esc_url_raw( $_POST['url'] ?? '' );
        $token = sanitize_text_field( $_POST['token'] ?? '' );
        if ( empty( $name ) || empty( $url ) || empty( $token ) ) {
            wp_send_json_error( 'Name, URL, and token are required.' );
        }
        $site = WPDash_SA_Sites_Manager::add_site( $name, $url, $token );
        // Auto-activate if this is the first site
        if ( ! WPDash_SA_Sites_Manager::get_active_site_id() ) {
            WPDash_SA_Sites_Manager::set_active_site( $site['id'] );
        }
        wp_send_json_success( $site );
    }

    public function handle_remove_site(): void {
        $this->verify();
        $id = sanitize_text_field( $_POST['site_id'] ?? '' );
        if ( empty( $id ) ) {
            wp_send_json_error( 'Missing site_id.' );
        }
        $result = WPDash_SA_Sites_Manager::remove_site( $id );
        // If removed site was active, auto-switch to first remaining
        if ( WPDash_SA_Sites_Manager::get_active_site_id() === $id ) {
            $remaining = WPDash_SA_Sites_Manager::get_sites();
            $first     = array_key_first( $remaining );
            if ( $first ) {
                WPDash_SA_Sites_Manager::set_active_site( $first );
            } else {
                delete_user_meta( get_current_user_id(), 'wpdash_sa_active_site' );
            }
        }
        wp_send_json_success( [ 'removed' => $result ] );
    }

    public function handle_switch_site(): void {
        $this->verify();
        $id = sanitize_text_field( $_POST['site_id'] ?? '' );
        if ( empty( $id ) || ! WPDash_SA_Sites_Manager::get_site( $id ) ) {
            wp_send_json_error( 'Invalid site_id.' );
        }
        WPDash_SA_Sites_Manager::set_active_site( $id );
        wp_send_json_success( [ 'active_site' => $id ] );
    }

    public function handle_test_connection(): void {
        $this->verify();
        $url   = esc_url_raw( $_POST['url'] ?? '' );
        $token = sanitize_text_field( $_POST['token'] ?? '' );
        if ( empty( $url ) || empty( $token ) ) {
            wp_send_json_error( 'URL and token are required.' );
        }
        $client = new WPDash_SA_Bridge_Client( $url, $token );
        $health = $client->get_health();
        if ( isset( $health['error'] ) ) {
            wp_send_json_error( $health['error'] );
        }
        wp_send_json_success( $health );
    }

    // -------------------------------------------------------------------------
    // Health
    // -------------------------------------------------------------------------

    public function handle_get_health(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_health() );
    }

    // -------------------------------------------------------------------------
    // Plugins
    // -------------------------------------------------------------------------

    public function handle_get_plugins(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_plugins() );
    }

    public function handle_plugin_action(): void {
        $this->verify();
        $client = $this->require_client();
        $action = sanitize_text_field( $_POST['plugin_action'] ?? '' );
        $slug   = sanitize_text_field( $_POST['slug'] ?? '' );
        if ( empty( $slug ) ) {
            wp_send_json_error( 'Missing slug' );
        }
        $result = $client->manage_plugin( $action, $slug );
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    public function handle_install_plugin(): void {
        $this->verify();
        $client = $this->require_client();
        $slug   = sanitize_text_field( $_POST['slug'] ?? '' );
        if ( empty( $slug ) ) {
            wp_send_json_error( 'Missing slug' );
        }
        $result = $client->install_plugin( $slug );
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    // -------------------------------------------------------------------------
    // Themes
    // -------------------------------------------------------------------------

    public function handle_get_themes(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_themes() );
    }

    public function handle_theme_action(): void {
        $this->verify();
        $client     = $this->require_client();
        $action     = sanitize_text_field( $_POST['theme_action'] ?? '' );
        $stylesheet = sanitize_text_field( $_POST['stylesheet'] ?? '' );
        if ( empty( $stylesheet ) ) {
            wp_send_json_error( 'Missing stylesheet' );
        }
        $result = $client->manage_theme( $action, $stylesheet );
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    // -------------------------------------------------------------------------
    // Users
    // -------------------------------------------------------------------------

    public function handle_get_users(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_users() );
    }

    public function handle_user_action(): void {
        $this->verify();
        $client = $this->require_client();
        $action = sanitize_text_field( $_POST['user_action'] ?? '' );
        $params = [];
        switch ( $action ) {
            case 'create':
                $params = [
                    'username' => sanitize_text_field( $_POST['username'] ?? '' ),
                    'email'    => sanitize_email( $_POST['email'] ?? '' ),
                    'password' => $_POST['password'] ?? '',
                    'role'     => sanitize_text_field( $_POST['role'] ?? 'subscriber' ),
                ];
                break;
            case 'delete':
                $params = [ 'user_id' => (int) ( $_POST['user_id'] ?? 0 ) ];
                break;
            case 'change_role':
                $params = [
                    'user_id' => (int) ( $_POST['user_id'] ?? 0 ),
                    'role'    => sanitize_text_field( $_POST['role'] ?? '' ),
                ];
                break;
            default:
                wp_send_json_error( 'Unknown action' );
        }
        $result = $client->manage_user( $action, $params );
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    // -------------------------------------------------------------------------
    // Content
    // -------------------------------------------------------------------------

    public function handle_get_content(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_content() );
    }

    public function handle_content_action(): void {
        $this->verify();
        $client  = $this->require_client();
        $action  = sanitize_text_field( $_POST['content_action'] ?? '' );
        $post_id = (int) ( $_POST['post_id'] ?? 0 );
        if ( ! $post_id ) {
            wp_send_json_error( 'Missing post_id' );
        }
        $result = $client->manage_content( $action, $post_id );
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    // -------------------------------------------------------------------------
    // Database
    // -------------------------------------------------------------------------

    public function handle_get_database(): void {
        $this->verify();
        $client = $this->require_client();
        $data   = $client->get_database();
        wp_send_json_success( [
            'tables'  => $data['tables'] ?? $data,
            'cleanup' => $data['cleanup'] ?? [],
        ] );
    }

    public function handle_database_action(): void {
        $this->verify();
        $client = $this->require_client();
        $action = sanitize_text_field( $_POST['db_action'] ?? '' );
        switch ( $action ) {
            case 'cleanup':
                $type   = sanitize_text_field( $_POST['cleanup_type'] ?? '' );
                $result = $client->cleanup_database( $type );
                if ( isset( $result['error'] ) ) {
                    wp_send_json_error( $result['error'] );
                }
                wp_send_json_success( $result );
                break;
            case 'optimize':
                $result = $client->optimize_database();
                if ( isset( $result['error'] ) ) {
                    wp_send_json_error( $result['error'] );
                }
                wp_send_json_success( $result );
                break;
            default:
                wp_send_json_error( 'Unknown action' );
        }
    }

    // -------------------------------------------------------------------------
    // Security
    // -------------------------------------------------------------------------

    public function handle_get_security(): void {
        $this->verify();
        $client = $this->require_client();
        $result = $client->get_security();
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    // -------------------------------------------------------------------------
    // SEO
    // -------------------------------------------------------------------------

    public function handle_get_seo(): void {
        $this->verify();
        $client = $this->require_client();
        $url    = esc_url_raw( $_POST['url'] ?? '' );
        if ( empty( $url ) ) {
            wp_send_json_error( 'Missing URL' );
        }
        $result = $client->get_seo( $url );
        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }
        wp_send_json_success( $result );
    }

    // -------------------------------------------------------------------------
    // Logs
    // -------------------------------------------------------------------------

    public function handle_get_logs(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_logs() );
    }

    public function handle_clear_logs(): void {
        $this->verify();
        wp_send_json_error( 'Log clearing is not supported via the bridge API.' );
    }

    // -------------------------------------------------------------------------
    // Backup
    // -------------------------------------------------------------------------

    public function handle_get_backup(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_backup() );
    }

    // -------------------------------------------------------------------------
    // WooCommerce
    // -------------------------------------------------------------------------

    public function handle_get_woocommerce(): void {
        $this->verify();
        $client = $this->require_client();
        wp_send_json_success( $client->get_woo_stats() );
    }
}
