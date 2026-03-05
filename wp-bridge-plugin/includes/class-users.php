<?php
/**
 * Users endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Users {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    /** All valid WordPress roles */
    private const VALID_ROLES = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/users', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_users'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/users/manage', [
            'methods'             => 'POST',
            'callback'            => [$this, 'manage_user'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    public function get_users(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        $role = sanitize_text_field($request->get_param('role') ?? '');

        $args = [
            'orderby' => 'registered',
            'order'   => 'DESC',
            'number'  => 100,
        ];
        if (!empty($role)) {
            $args['role'] = $role;
        }

        $users  = get_users($args);
        $result = [];

        foreach ($users as $user) {
            $result[] = [
                'id'           => $user->ID,
                'login'        => $user->user_login,
                'email'        => $user->user_email,
                'display_name' => $user->display_name,
                'roles'        => $user->roles,
                'registered_at'=> $user->user_registered,
                'avatar_url'   => get_avatar_url($user->ID, ['size' => 48]),
                'posts_count'  => count_user_posts($user->ID),
            ];
        }

        return new WP_REST_Response($result, 200);
    }

    public function manage_user(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        $action = sanitize_text_field($request->get_param('action') ?? '');

        switch ($action) {
            case 'create':
                return $this->create_user($request);
            case 'delete':
                return $this->delete_user($request);
            case 'change_role':
                return $this->change_role($request);
            default:
                return new WP_Error('invalid_action', 'Invalid action. Use: create, delete, change_role', ['status' => 400]);
        }
    }

    private function create_user(WP_REST_Request $request) {
        $email    = sanitize_email($request->get_param('email') ?? '');
        $username = sanitize_user($request->get_param('username') ?? '');
        $role     = sanitize_text_field($request->get_param('role') ?? 'subscriber');

        if (empty($email) || empty($username)) {
            return new WP_Error('missing_params', 'email and username are required', ['status' => 400]);
        }
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email address', ['status' => 400]);
        }
        if (!in_array($role, self::VALID_ROLES, true)) {
            return new WP_Error('invalid_role', 'Invalid role', ['status' => 400]);
        }
        if (username_exists($username)) {
            return new WP_Error('username_exists', 'Username already exists', ['status' => 409]);
        }
        if (email_exists($email)) {
            return new WP_Error('email_exists', 'Email already registered', ['status' => 409]);
        }

        $password = wp_generate_password(16, true, true);
        $user_id  = wp_create_user($username, $password, $email);
        if (is_wp_error($user_id)) return $user_id;

        $user = new WP_User($user_id);
        $user->set_role($role);

        // Send welcome email with password
        wp_new_user_notification($user_id, null, 'both');

        return new WP_REST_Response([
            'message'  => 'User created and welcome email sent',
            'user_id'  => $user_id,
            'username' => $username,
            'email'    => $email,
            'role'     => $role,
        ], 201);
    }

    private function delete_user(WP_REST_Request $request) {
        $user_id = intval($request->get_param('user_id') ?? 0);
        if (!$user_id || !get_user_by('ID', $user_id)) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        // Prevent deleting the only administrator
        $admins = get_users(['role' => 'administrator', 'fields' => 'ID']);
        $user   = get_user_by('ID', $user_id);
        if (in_array('administrator', (array)$user->roles, true) && count($admins) <= 1) {
            return new WP_Error('cannot_delete_only_admin', 'Cannot delete the only administrator', ['status' => 400]);
        }

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }
        wp_delete_user($user_id);

        return new WP_REST_Response(['message' => 'User deleted', 'user_id' => $user_id], 200);
    }

    private function change_role(WP_REST_Request $request) {
        $user_id = intval($request->get_param('user_id') ?? 0);
        $role    = sanitize_text_field($request->get_param('role') ?? '');

        if (!$user_id || !$role) {
            return new WP_Error('missing_params', 'user_id and role are required', ['status' => 400]);
        }
        if (!in_array($role, self::VALID_ROLES, true)) {
            return new WP_Error('invalid_role', 'Invalid role', ['status' => 400]);
        }

        $user = get_user_by('ID', $user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        $user->set_role($role);

        return new WP_REST_Response(['message' => 'Role updated', 'user_id' => $user_id, 'role' => $role], 200);
    }
}
