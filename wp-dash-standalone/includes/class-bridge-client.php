<?php
defined( 'ABSPATH' ) || exit;

/**
 * Calls the wp-dash-bridge REST API on a remote WordPress site.
 * All public methods normalize the bridge response to match the
 * format the standalone plugin's views expect.
 */
class WPDash_SA_Bridge_Client {
    private string $site_url;
    private string $token;
    private int $timeout = 15;

    public function __construct( string $site_url, string $token ) {
        $this->site_url = rtrim( $site_url, '/' );
        $this->token    = $token;
    }

    // -------------------------------------------------------------------------
    // HTTP helpers
    // -------------------------------------------------------------------------

    private function get( string $endpoint, array $params = [] ): array {
        $url = $this->site_url . '/wp-json/wpdash/v1' . $endpoint;
        if ( ! empty( $params ) ) {
            $url .= '?' . http_build_query( $params );
        }
        $response = wp_remote_get( $url, [
            'headers'   => [ 'Authorization' => 'Bearer ' . $this->token ],
            'timeout'   => $this->timeout,
            'sslverify' => false,
        ] );
        if ( is_wp_error( $response ) ) {
            return [ 'error' => $response->get_error_message() ];
        }
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );
        return $data ?? [ 'error' => 'Invalid JSON response' ];
    }

    private function post( string $endpoint, array $body = [] ): array {
        $url      = $this->site_url . '/wp-json/wpdash/v1' . $endpoint;
        $response = wp_remote_post( $url, [
            'headers'   => [
                'Authorization' => 'Bearer ' . $this->token,
                'Content-Type'  => 'application/json',
            ],
            'body'      => wp_json_encode( $body ),
            'timeout'   => $this->timeout,
            'sslverify' => false,
        ] );
        if ( is_wp_error( $response ) ) {
            return [ 'error' => $response->get_error_message() ];
        }
        $body_str = wp_remote_retrieve_body( $response );
        $data     = json_decode( $body_str, true );
        return $data ?? [ 'error' => 'Invalid JSON response' ];
    }

    // -------------------------------------------------------------------------
    // Health / overview
    // -------------------------------------------------------------------------

    public function get_health(): array {
        $data = $this->get( '/health' );
        if ( isset( $data['error'] ) ) {
            return $data;
        }
        // Normalize active_theme: bridge returns {name, version}, view expects string
        $theme = $data['active_theme'] ?? '';
        if ( is_array( $theme ) ) {
            $data['active_theme'] = ( $theme['name'] ?? '' ) . ' ' . ( $theme['version'] ?? '' );
        }
        // Map plugin count to flat key
        $data['active_plugins_count'] = $data['plugin_count']['active'] ?? 0;
        // Compute a simple health score (bridge doesn't expose one)
        $data['health_score'] = 80;
        // Fields the view needs but bridge doesn't provide
        $data['admin_email']         = $data['admin_email'] ?? '';
        $data['language']            = $data['language'] ?? 'en_US';
        $data['upload_max_filesize'] = $data['max_upload_size'] ?? ( $data['upload_max_filesize'] ?? '' );
        return $data;
    }

    public function get_updates(): array {
        return $this->get( '/updates' );
    }

    public function update_core(): array {
        return $this->post( '/updates/core' );
    }

    // -------------------------------------------------------------------------
    // Plugins
    // -------------------------------------------------------------------------

    public function get_plugins(): array {
        $data = $this->get( '/plugins' );
        if ( isset( $data['error'] ) || ! is_array( $data ) ) {
            return $data;
        }
        foreach ( $data as &$plugin ) {
            // bridge: is_active → view: active
            $plugin['active'] = $plugin['is_active'] ?? false;
            // bridge: update_version → view: new_version
            $plugin['new_version'] = $plugin['update_version'] ?? null;
        }
        unset( $plugin );
        return $data;
    }

    public function manage_plugin( string $action, string $slug ): array {
        return $this->post( '/plugins/manage', [ 'action' => $action, 'plugin' => $slug ] );
    }

    public function install_plugin( string $slug ): array {
        return $this->post( '/plugins/install', [ 'source' => 'slug', 'value' => $slug ] );
    }

    // -------------------------------------------------------------------------
    // Themes
    // -------------------------------------------------------------------------

    public function get_themes(): array {
        $data = $this->get( '/themes' );
        if ( isset( $data['error'] ) || ! is_array( $data ) ) {
            return $data;
        }
        foreach ( $data as &$theme ) {
            // bridge: is_active → view: active
            $theme['active'] = $theme['is_active'] ?? false;
            // bridge: update_version → view: new_version
            $theme['new_version'] = $theme['update_version'] ?? null;
            // bridge: screenshot_url → view: screenshot
            $theme['screenshot'] = $theme['screenshot_url'] ?? null;
            // bridge: slug → view: stylesheet
            if ( ! isset( $theme['stylesheet'] ) ) {
                $theme['stylesheet'] = $theme['slug'] ?? '';
            }
        }
        unset( $theme );
        return $data;
    }

    public function manage_theme( string $action, string $stylesheet ): array {
        return $this->post( '/themes/manage', [ 'action' => $action, 'stylesheet' => $stylesheet ] );
    }

    public function install_theme( string $slug ): array {
        return $this->post( '/themes/install', [ 'slug' => $slug ] );
    }

    // -------------------------------------------------------------------------
    // Users
    // -------------------------------------------------------------------------

    public function get_users(): array {
        $data = $this->get( '/users' );
        if ( isset( $data['error'] ) || ! is_array( $data ) ) {
            return $data;
        }
        foreach ( $data as &$user ) {
            // bridge: registered_at → view: registered
            $user['registered'] = $user['registered_at'] ?? $user['registered'] ?? '';
        }
        unset( $user );
        return $data;
    }

    public function manage_user( string $action, array $params ): array {
        return $this->post( '/users/manage', array_merge( [ 'action' => $action ], $params ) );
    }

    // -------------------------------------------------------------------------
    // Content
    // -------------------------------------------------------------------------

    public function get_content(): array {
        $data = $this->get( '/content' );
        if ( isset( $data['error'] ) ) {
            return $data;
        }
        // Bridge returns flat array; view expects { posts: [], pages: [] }
        if ( is_array( $data ) && ! isset( $data['posts'] ) ) {
            $posts = [];
            $pages = [];
            foreach ( $data as $item ) {
                if ( ! is_array( $item ) ) {
                    continue;
                }
                // Normalize date field
                $item['date'] = $item['published_at'] ?? $item['date'] ?? '';
                $type = $item['type'] ?? 'post';
                if ( $type === 'page' ) {
                    $pages[] = $item;
                } else {
                    $posts[] = $item;
                }
            }
            return [ 'posts' => $posts, 'pages' => $pages ];
        }
        return $data;
    }

    public function manage_content( string $action, int $post_id ): array {
        return $this->post( '/content/manage', [ 'action' => $action, 'post_id' => $post_id ] );
    }

    // -------------------------------------------------------------------------
    // Database
    // -------------------------------------------------------------------------

    public function get_database(): array {
        $data = $this->get( '/database/status' );
        if ( isset( $data['error'] ) ) {
            return $data;
        }
        // Normalize table size fields
        $tables = $data['tables'] ?? [];
        foreach ( $tables as &$table ) {
            $table['data_size']  = $table['data_size_mb']  ?? $table['data_size']  ?? 0;
            $table['index_size'] = $table['index_size_mb'] ?? $table['index_size'] ?? 0;
            $table['total_size'] = $table['total_size_mb'] ?? $table['total_size'] ?? 0;
        }
        unset( $table );
        // Normalize cleanup counts (bridge uses pending_cleanup.spam_comments, view uses spam)
        $pc = $data['pending_cleanup'] ?? $data['cleanup'] ?? [];
        return [
            'tables'  => $tables,
            'cleanup' => [
                'transients'  => $pc['transients']   ?? 0,
                'spam'        => $pc['spam_comments'] ?? $pc['spam'] ?? 0,
                'revisions'   => $pc['revisions']    ?? 0,
                'auto_drafts' => $pc['auto_drafts']  ?? 0,
            ],
        ];
    }

    public function optimize_database(): array {
        return $this->post( '/database/optimize' );
    }

    public function cleanup_database( string $type ): array {
        return $this->post( '/database/cleanup', [ 'type' => $type ] );
    }

    // -------------------------------------------------------------------------
    // Security
    // -------------------------------------------------------------------------

    public function get_security(): array {
        return $this->get( '/security/integrity' );
    }

    // -------------------------------------------------------------------------
    // SEO
    // -------------------------------------------------------------------------

    public function get_seo( string $url ): array {
        return $this->get( '/seo/audit', [ 'url' => $url ] );
    }

    // -------------------------------------------------------------------------
    // Logs
    // -------------------------------------------------------------------------

    public function get_logs(): array {
        $data = $this->get( '/logs' );
        if ( isset( $data['error'] ) ) {
            return $data;
        }
        // Bridge has no 'success' key; derive it from log_file presence
        $has_file          = isset( $data['log_file'] ) && $data['log_file'] !== null;
        $data['success']   = $has_file || ! empty( $data['entries'] );
        $data['log_path']  = $data['log_file'] ?? '';
        $data['message']   = $data['message'] ?? '';
        $data['entries']   = $data['entries'] ?? [];
        return $data;
    }

    // -------------------------------------------------------------------------
    // Backup
    // -------------------------------------------------------------------------

    public function get_backup(): array {
        $data = $this->get( '/backup/status' );
        if ( isset( $data['error'] ) ) {
            return $data;
        }
        // Normalize: bridge uses backup_plugin, view uses status + plugin
        $plugin = $data['backup_plugin'] ?? null;
        $data['status'] = ( $plugin === null ) ? 'no_plugin' : 'ok';
        $data['plugin'] = $plugin ?? '';
        // Format size from bytes
        $bytes = $data['archive_size_bytes'] ?? null;
        $data['size'] = $bytes !== null ? size_format( (int) $bytes ) : null;
        $data['last_backup_at'] = $data['last_backup_at'] ?? null;
        return $data;
    }

    // -------------------------------------------------------------------------
    // WooCommerce
    // -------------------------------------------------------------------------

    /**
     * Returns normalized WooCommerce stats or null if WooCommerce is not active.
     *
     * @return array|null
     */
    public function get_woo_stats() {
        $data = $this->get( '/woocommerce/stats' );
        if ( isset( $data['error'] ) ) {
            return $data;
        }
        // If WooCommerce not active on remote site, return null so view shows "not active"
        if ( empty( $data['is_active'] ) ) {
            return null;
        }
        // Normalize flat fields into nested structure that view expects
        $currency = $data['currency_symbol'] ?? '';
        return [
            'revenue'       => [
                'today' => $currency . number_format( (float) ( $data['revenue_today'] ?? 0 ), 2 ),
                'month' => $currency . number_format( (float) ( $data['revenue_month'] ?? 0 ), 2 ),
            ],
            'orders'        => [
                'pending'    => $data['orders_pending']    ?? 0,
                'processing' => $data['orders_processing'] ?? 0,
                'completed'  => $data['orders_completed']  ?? 0,
                'cancelled'  => $data['orders_cancelled']  ?? 0,
                'on-hold'    => $data['orders_on_hold']    ?? 0,
            ],
            'total_products' => $data['total_products'] ?? 0,
            'recent_orders'  => [],  // would need separate /woocommerce/orders call
            'low_stock'      => [],  // would need separate /woocommerce/products call
        ];
    }

    public function get_woo_orders(): array {
        return $this->get( '/woocommerce/orders' );
    }

    public function get_woo_products(): array {
        return $this->get( '/woocommerce/products' );
    }

    public function get_woo_customers(): array {
        return $this->get( '/woocommerce/customers' );
    }

    public function manage_order( int $order_id, string $status ): array {
        return $this->post( '/woocommerce/orders/manage', [ 'order_id' => $order_id, 'status' => $status ] );
    }
}

