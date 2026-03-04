<?php
/**
 * Admin settings page for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Admin_Page {

    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu_page']);
        add_action('admin_init', [$this, 'handle_actions']);
    }

    /**
     * Register the settings page under Settings menu.
     */
    public function add_menu_page(): void {
        add_options_page(
            __('WP Dash Bridge', 'wp-dash-bridge'),
            __('WP Dash Bridge', 'wp-dash-bridge'),
            'manage_options',
            'wpdash-bridge',
            [$this, 'render_page']
        );
    }

    /**
     * Handle form actions (regenerate, revoke).
     */
    public function handle_actions(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (isset($_POST['wpdash_regenerate_token']) && check_admin_referer('wpdash_bridge_actions')) {
            $token = bin2hex(random_bytes(32));
            update_option('wpdash_bridge_token_hash', hash('sha256', $token));
            set_transient('wpdash_bridge_initial_token', $token, 300);
            add_settings_error('wpdash_bridge', 'token_regenerated', __('Token regenerated successfully. Copy it now — it will not be shown again.', 'wp-dash-bridge'), 'success');
        }

        if (isset($_POST['wpdash_revoke_token']) && check_admin_referer('wpdash_bridge_actions')) {
            delete_option('wpdash_bridge_token_hash');
            delete_transient('wpdash_bridge_initial_token');
            add_settings_error('wpdash_bridge', 'token_revoked', __('Token revoked. API access is now disabled.', 'wp-dash-bridge'), 'warning');
        }
    }

    /**
     * Render the admin settings page.
     */
    public function render_page(): void {
        $token_hash = get_option('wpdash_bridge_token_hash');
        $initial_token = get_transient('wpdash_bridge_initial_token');
        $is_configured = !empty($token_hash);

        require WPDASH_BRIDGE_PATH . 'admin/views/settings-page.php';
    }
}
