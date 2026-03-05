<?php
/**
 * Themes endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Themes {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/themes', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_themes'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/themes/manage', [
            'methods'             => 'POST',
            'callback'            => [$this, 'manage_theme'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/themes/install', [
            'methods'             => 'POST',
            'callback'            => [$this, 'install_theme'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    public function get_themes(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        if (!function_exists('wp_get_themes')) {
            require_once ABSPATH . 'wp-admin/includes/theme.php';
        }

        $themes        = wp_get_themes(['allowed' => null]);
        $current       = get_stylesheet();
        $theme_updates = get_site_transient('update_themes');

        $result = [];
        foreach ($themes as $slug => $theme) {
            $has_update     = isset($theme_updates->response[$slug]);
            $update_version = $has_update ? ($theme_updates->response[$slug]['new_version'] ?? null) : null;

            $result[] = [
                'slug'           => $slug,
                'name'           => $theme->get('Name'),
                'version'        => $theme->get('Version'),
                'author'         => $theme->get('Author'),
                'description'    => wp_strip_all_tags($theme->get('Description')),
                'is_active'      => $slug === $current,
                'has_update'     => $has_update,
                'update_version' => $update_version,
                'screenshot_url' => $theme->get_screenshot('uri') ?: null,
                'tags'           => $theme->get('Tags'),
            ];
        }

        // Active theme first
        usort($result, fn($a, $b) => $b['is_active'] <=> $a['is_active']);

        return new WP_REST_Response($result, 200);
    }

    public function manage_theme(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        $action = sanitize_text_field($request->get_param('action') ?? '');
        $slug   = sanitize_text_field($request->get_param('slug') ?? '');

        if (empty($action) || empty($slug)) {
            return new WP_Error('missing_params', 'action and slug are required', ['status' => 400]);
        }

        if (!function_exists('wp_get_themes')) {
            require_once ABSPATH . 'wp-admin/includes/theme.php';
        }

        switch ($action) {
            case 'activate':
                if (!wp_get_theme($slug)->exists()) {
                    return new WP_Error('theme_not_found', 'Theme not found', ['status' => 404]);
                }
                switch_theme($slug);
                return new WP_REST_Response(['message' => 'Theme activated', 'theme' => $slug], 200);

            case 'delete':
                if (get_stylesheet() === $slug) {
                    return new WP_Error('cannot_delete_active', 'Cannot delete the currently active theme', ['status' => 400]);
                }
                if (!wp_get_theme($slug)->exists()) {
                    return new WP_Error('theme_not_found', 'Theme not found', ['status' => 404]);
                }
                $deleted = delete_theme($slug);
                if (is_wp_error($deleted)) return $deleted;
                return new WP_REST_Response(['message' => 'Theme deleted', 'theme' => $slug], 200);

            case 'update':
                if (!function_exists('wp_update_themes')) {
                    require_once ABSPATH . 'wp-admin/includes/update.php';
                }
                require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
                $upgrader = new Theme_Upgrader(new WP_Ajax_Upgrader_Skin());
                $result   = $upgrader->upgrade($slug);
                if (is_wp_error($result)) return $result;
                return new WP_REST_Response(['message' => 'Theme updated', 'theme' => $slug], 200);

            default:
                return new WP_Error('invalid_action', 'Invalid action. Use: activate, delete, update', ['status' => 400]);
        }
    }

    public function install_theme(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        $slug = sanitize_text_field($request->get_param('slug') ?? '');
        if (empty($slug)) {
            return new WP_Error('missing_slug', 'slug is required', ['status' => 400]);
        }

        if (!function_exists('wp_get_themes')) {
            require_once ABSPATH . 'wp-admin/includes/theme.php';
        }

        // Already installed
        if (wp_get_theme($slug)->exists()) {
            return new WP_REST_Response(['message' => 'Theme already installed', 'theme' => $slug], 201);
        }

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        $upgrader = new Theme_Upgrader(new WP_Ajax_Upgrader_Skin());
        $result   = $upgrader->install("https://downloads.wordpress.org/theme/{$slug}.latest-stable.zip");
        if (is_wp_error($result)) return $result;

        return new WP_REST_Response(['message' => 'Theme installed', 'theme' => $slug], 201);
    }
}
