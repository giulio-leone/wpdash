<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Users_Manager {

    public function get_users(): array {
        $users  = get_users( [ 'number' => 200 ] );
        $result = [];

        foreach ( $users as $user ) {
            $result[] = [
                'id'           => $user->ID,
                'login'        => $user->user_login,
                'email'        => $user->user_email,
                'display_name' => $user->display_name,
                'roles'        => $user->roles,
                'registered'   => $user->user_registered,
            ];
        }

        return $result;
    }

    public function create( array $data ): array {
        $user_data = [
            'user_login' => sanitize_user( $data['username'] ?? '' ),
            'user_email' => sanitize_email( $data['email'] ?? '' ),
            'user_pass'  => $data['password'] ?? wp_generate_password(),
            'role'       => sanitize_text_field( $data['role'] ?? 'subscriber' ),
        ];

        $user_id = wp_insert_user( $user_data );

        if ( is_wp_error( $user_id ) ) {
            return [ 'success' => false, 'message' => $user_id->get_error_message() ];
        }

        return [ 'success' => true, 'user_id' => $user_id ];
    }

    public function delete( int $user_id ): bool {
        require_once ABSPATH . 'wp-admin/includes/user.php';
        return wp_delete_user( $user_id );
    }

    public function change_role( int $user_id, string $role ): bool {
        $user = new WP_User( $user_id );
        if ( ! $user->exists() ) {
            return false;
        }
        $user->set_role( sanitize_text_field( $role ) );
        return true;
    }
}
