<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Plugins_Manager {

    public function get_plugins(): array {
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $all_plugins    = get_plugins();
        $active_plugins = get_option( 'active_plugins', [] );
        $updates        = get_site_transient( 'update_plugins' );
        $result         = [];

        foreach ( $all_plugins as $slug => $data ) {
            $has_update = isset( $updates->response[ $slug ] );
            $result[]   = [
                'slug'        => $slug,
                'name'        => $data['Name'],
                'version'     => $data['Version'],
                'author'      => $data['Author'],
                'description' => $data['Description'],
                'active'      => in_array( $slug, $active_plugins, true ),
                'has_update'  => $has_update,
                'new_version' => $has_update ? $updates->response[ $slug ]->new_version : null,
            ];
        }

        return $result;
    }

    public function activate( string $slug ): bool {
        if ( ! function_exists( 'activate_plugin' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $result = activate_plugin( $slug );
        return ! is_wp_error( $result );
    }

    public function deactivate( string $slug ): bool {
        if ( ! function_exists( 'deactivate_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        deactivate_plugins( $slug );
        return true;
    }

    public function delete( string $slug ): bool {
        if ( ! function_exists( 'delete_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $result = delete_plugins( [ $slug ] );
        return $result !== false;
    }

    public function update( string $slug ): array {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';

        $skin     = new WP_Ajax_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader( $skin );
        $result   = $upgrader->upgrade( $slug );

        if ( is_wp_error( $result ) ) {
            return [ 'success' => false, 'message' => $result->get_error_message() ];
        }

        return [ 'success' => true ];
    }

    public function install( string $slug ): array {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        $api = plugins_api( 'plugin_information', [
            'slug'   => $slug,
            'fields' => [ 'sections' => false ],
        ] );

        if ( is_wp_error( $api ) ) {
            return [ 'success' => false, 'message' => $api->get_error_message() ];
        }

        $skin     = new WP_Ajax_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader( $skin );
        $result   = $upgrader->install( $api->download_link );

        if ( is_wp_error( $result ) ) {
            return [ 'success' => false, 'message' => $result->get_error_message() ];
        }

        return [ 'success' => true ];
    }
}
