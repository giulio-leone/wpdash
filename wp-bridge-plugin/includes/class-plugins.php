<?php
/**
 * Plugin management endpoints for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Plugins {

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
        register_rest_route('wpdash/v1', '/plugins', [
            'methods'             => 'GET',
            'callback'            => [$this, 'list_plugins'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);

        register_rest_route('wpdash/v1', '/plugins/manage', [
            'methods'             => 'POST',
            'callback'            => [$this, 'manage_plugin'],
            'permission_callback' => [$this->auth, 'check_permission'],
            'args'                => [
                'action' => [
                    'required'          => true,
                    'type'              => 'string',
                    'enum'              => ['activate', 'deactivate', 'update', 'delete'],
                    'validate_callback' => function ($value) {
                        return in_array($value, ['activate', 'deactivate', 'update', 'delete'], true);
                    },
                ],
                'plugin' => [
                    'required' => true,
                    'type'     => 'string',
                ],
            ],
        ]);

        register_rest_route('wpdash/v1', '/plugins/install', [
            'methods'             => 'POST',
            'callback'            => [$this, 'install_plugin'],
            'permission_callback' => [$this->auth, 'check_permission'],
            'args'                => [
                'source' => [
                    'required'          => true,
                    'type'              => 'string',
                    'enum'              => ['url', 'slug'],
                    'validate_callback' => function ($value) {
                        return in_array($value, ['url', 'slug'], true);
                    },
                ],
                'value' => [
                    'required' => true,
                    'type'     => 'string',
                ],
            ],
        ]);
    }

    /**
     * List all plugins.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function list_plugins(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $all_plugins    = get_plugins();
        $active_plugins = get_option('active_plugins', []);
        $updates        = get_site_transient('update_plugins');

        $result = [];
        foreach ($all_plugins as $file => $data) {
            $has_update     = isset($updates->response[$file]);
            $update_version = $has_update ? $updates->response[$file]->new_version : null;
            $slug           = dirname($file);
            if ($slug === '.') {
                $slug = basename($file, '.php');
            }

            $result[] = [
                'name'           => $data['Name'],
                'slug'           => $slug,
                'file'           => $file,
                'version'        => $data['Version'],
                'is_active'      => in_array($file, $active_plugins, true),
                'has_update'     => $has_update,
                'update_version' => $update_version,
                'author'         => wp_strip_all_tags($data['Author']),
                'description'    => wp_strip_all_tags($data['Description']),
            ];
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * Manage a single plugin (activate / deactivate / update / delete).
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function manage_plugin(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $action       = $request->get_param('action');
        $plugin_input = (string) $request->get_param('plugin');

        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $all_plugins = get_plugins();
        $plugin      = $this->resolve_plugin_file($plugin_input, $all_plugins);
        if ($plugin === null) {
            return new WP_Error('not_found', 'Plugin not found', ['status' => 404]);
        }

        switch ($action) {
            case 'activate':
                $result = activate_plugin($plugin);
                if (is_wp_error($result)) {
                    return $result;
                }
                return new WP_REST_Response(['message' => 'Plugin activated', 'plugin' => $plugin], 200);

            case 'deactivate':
                deactivate_plugins($plugin);
                return new WP_REST_Response(['message' => 'Plugin deactivated', 'plugin' => $plugin], 200);

            case 'update':
                return $this->do_update($plugin);

            case 'delete':
                if (is_plugin_active($plugin)) {
                    return new WP_Error('active_plugin', 'Deactivate the plugin before deleting', ['status' => 400]);
                }
                require_once ABSPATH . 'wp-admin/includes/file.php';
                if (!function_exists('WP_Filesystem') || !WP_Filesystem()) {
                    return new WP_Error('filesystem_unavailable', 'Filesystem access not available for plugin deletion', ['status' => 500]);
                }
                $deleted = delete_plugins([$plugin]);
                if (is_wp_error($deleted)) {
                    return $deleted;
                }
                return new WP_REST_Response(['message' => 'Plugin deleted', 'plugin' => $plugin], 200);

            default:
                return new WP_Error('invalid_action', 'Invalid action', ['status' => 400]);
        }
    }

    /**
     * Install a plugin from URL or WordPress.org slug.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function install_plugin(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $source = $request->get_param('source');
        $value  = $request->get_param('value');

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        if ($source === 'slug') {
            $api = plugins_api('plugin_information', [
                'slug'   => $value,
                'fields' => ['sections' => false],
            ]);
            if (is_wp_error($api)) {
                return new WP_Error('plugin_not_found', 'Plugin not found on WordPress.org', ['status' => 404]);
            }
            $download_url = $api->download_link;
        } else {
            $download_url = $value;
        }

        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $result   = $upgrader->install($download_url);

        if (is_wp_error($result)) {
            return $result;
        }

        if ($result === false) {
            return new WP_Error('install_failed', 'Plugin installation failed', ['status' => 500]);
        }

        return new WP_REST_Response(['message' => 'Plugin installed', 'source' => $source, 'value' => $value], 201);
    }

    /**
     * Update a single plugin using the WordPress upgrader.
     *
     * @param string $plugin Plugin file path.
     * @return WP_REST_Response|WP_Error
     */
    private function do_update(string $plugin) {
        $updates = get_site_transient('update_plugins');
        if (!is_object($updates) || !isset($updates->response) || !isset($updates->response[$plugin])) {
            return new WP_REST_Response(['message' => 'Plugin is already up to date', 'plugin' => $plugin], 200);
        }

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $result   = $upgrader->upgrade($plugin);

        if (is_wp_error($result)) {
            return $result;
        }

        if ($result === false) {
            return new WP_Error('update_failed', 'Plugin update failed', ['status' => 500]);
        }

        return new WP_REST_Response(['message' => 'Plugin updated', 'plugin' => $plugin], 200);
    }

    /**
     * Resolve plugin identifier from file path or slug.
     *
     * @param string $plugin_input
     * @param array<string, array<string, mixed>> $all_plugins
     * @return string|null
     */
    private function resolve_plugin_file(string $plugin_input, array $all_plugins): ?string {
        if (isset($all_plugins[$plugin_input])) {
            return $plugin_input;
        }

        foreach ($all_plugins as $file => $data) {
            $slug = dirname($file);
            if ($slug === '.') {
                $slug = basename($file, '.php');
            }

            $base_file_slug = basename($file, '.php');
            $name_slug      = isset($data['Name']) ? sanitize_title((string) $data['Name']) : '';

            if (
                $plugin_input === $slug ||
                $plugin_input === $base_file_slug ||
                ($name_slug !== '' && $plugin_input === $name_slug)
            ) {
                return $file;
            }
        }

        return null;
    }
}
