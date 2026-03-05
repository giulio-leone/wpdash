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
        register_rest_route('wpdash/v1', '/updates', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_updates'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/updates/core', [
            'methods'             => 'POST',
            'callback'            => [$this, 'update_core'],
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

    /**
     * Get available updates: WP core, themes, plugin update count.
     */
    public function get_updates(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        if (!function_exists('get_core_updates')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }

        // Check WP core updates
        wp_version_check([], false);
        $core_updates = get_site_transient('update_core');

        $wp_core = ['available' => false, 'version' => null, 'current' => get_bloginfo('version')];
        if (isset($core_updates->updates) && is_array($core_updates->updates)) {
            foreach ($core_updates->updates as $update) {
                if (isset($update->response) && $update->response === 'upgrade') {
                    $wp_core = [
                        'available' => true,
                        'version'   => $update->version,
                        'current'   => get_bloginfo('version'),
                    ];
                    break;
                }
            }
        }

        // Check theme updates
        wp_update_themes();
        $theme_updates = get_site_transient('update_themes');
        $theme_list    = [];
        if (isset($theme_updates->response) && is_array($theme_updates->response)) {
            foreach ($theme_updates->response as $slug => $data) {
                $theme      = wp_get_theme($slug);
                $theme_list[] = [
                    'slug'            => $slug,
                    'name'            => $theme->get('Name'),
                    'current_version' => $theme->get('Version'),
                    'new_version'     => $data['new_version'] ?? null,
                ];
            }
        }

        // Plugin updates count
        $plugin_transient   = get_site_transient('update_plugins');
        $plugin_updates_count = isset($plugin_transient->response) ? count($plugin_transient->response) : 0;

        return new WP_REST_Response([
            'wp_core'              => $wp_core,
            'theme_updates'        => $theme_list,
            'theme_updates_count'  => count($theme_list),
            'plugin_updates_count' => $plugin_updates_count,
            'checked_at'           => gmdate('Y-m-d\TH:i:s\Z'),
        ], 200);
    }

    /**
     * Apply WordPress core update.
     */
    public function update_core(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        if (!function_exists('get_core_updates')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        wp_version_check([], false);
        $updates = get_core_updates();

        if (empty($updates)) {
            return new WP_REST_Response(['message' => 'WordPress is already up to date', 'updated' => false], 200);
        }

        $update = reset($updates);
        if (!isset($update->response) || $update->response !== 'upgrade') {
            return new WP_REST_Response(['message' => 'WordPress is already up to date', 'updated' => false], 200);
        }

        $upgrader = new Core_Upgrader(new WP_Ajax_Upgrader_Skin());
        $result   = $upgrader->upgrade($update);
        if (is_wp_error($result)) return $result;

        return new WP_REST_Response([
            'message'     => 'WordPress core updated successfully',
            'updated'     => true,
            'new_version' => $update->version,
        ], 200);
    }
}
