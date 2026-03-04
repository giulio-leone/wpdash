<?php
/**
 * Health endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Health {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    /**
     * Register REST routes.
     */
    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/health', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    /**
     * Handle the health request.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function handle(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        global $wpdb;

        // Measure DB latency
        $start = microtime(true);
        $wpdb->query('SELECT 1');
        $db_latency_ms = round((microtime(true) - $start) * 1000, 2);

        $theme = wp_get_theme();

        // Plugin counts
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $all_plugins    = get_plugins();
        $active_plugins = get_option('active_plugins', []);
        $active_count   = count($active_plugins);
        $total_count    = count($all_plugins);

        $data = [
            'wp_version'          => get_bloginfo('version'),
            'php_version'         => PHP_VERSION,
            'db_version'          => $wpdb->db_version(),
            'db_latency_ms'       => $db_latency_ms,
            'active_theme'        => [
                'name'    => $theme->get('Name'),
                'version' => $theme->get('Version'),
            ],
            'is_multisite'        => is_multisite(),
            'site_url'            => get_site_url(),
            'home_url'            => get_home_url(),
            'timezone'            => wp_timezone_string(),
            'memory_limit'        => WP_MEMORY_LIMIT,
            'max_upload_size'     => size_format(wp_max_upload_size()),
            'wp_debug'            => defined('WP_DEBUG') && WP_DEBUG,
            'ssl_enabled'         => is_ssl(),
            'permalink_structure' => get_option('permalink_structure') ?: 'plain',
            'plugin_count'        => [
                'active'   => $active_count,
                'inactive' => $total_count - $active_count,
                'total'    => $total_count,
            ],
            'checked_at'          => gmdate('Y-m-d\TH:i:s\Z'),
        ];

        return new WP_REST_Response($data, 200);
    }
}
