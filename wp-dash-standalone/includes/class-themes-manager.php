<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Themes_Manager {

    public function get_themes(): array {
        $themes          = wp_get_themes();
        $active          = get_stylesheet();
        $updates         = get_site_transient( 'update_themes' );
        $result          = [];

        foreach ( $themes as $stylesheet => $theme ) {
            $has_update = isset( $updates->response[ $stylesheet ] );
            $result[]   = [
                'stylesheet'  => $stylesheet,
                'name'        => $theme->get( 'Name' ),
                'version'     => $theme->get( 'Version' ),
                'author'      => $theme->get( 'Author' ),
                'description' => $theme->get( 'Description' ),
                'screenshot'  => $theme->get_screenshot(),
                'active'      => $stylesheet === $active,
                'has_update'  => $has_update,
                'new_version' => $has_update ? $updates->response[ $stylesheet ]['new_version'] : null,
            ];
        }

        return $result;
    }

    public function activate( string $stylesheet ): bool {
        $theme = wp_get_theme( $stylesheet );
        if ( ! $theme->exists() ) {
            return false;
        }
        switch_theme( $stylesheet );
        return true;
    }

    public function delete( string $stylesheet ): bool {
        if ( ! function_exists( 'delete_theme' ) ) {
            require_once ABSPATH . 'wp-admin/includes/theme.php';
        }
        return delete_theme( $stylesheet );
    }

    public function install( string $slug ): array {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/theme-install.php';

        $api = themes_api( 'theme_information', [
            'slug'   => $slug,
            'fields' => [ 'sections' => false ],
        ] );

        if ( is_wp_error( $api ) ) {
            return [ 'success' => false, 'message' => $api->get_error_message() ];
        }

        $skin     = new WP_Ajax_Upgrader_Skin();
        $upgrader = new Theme_Upgrader( $skin );
        $result   = $upgrader->install( $api->download_link );

        if ( is_wp_error( $result ) ) {
            return [ 'success' => false, 'message' => $result->get_error_message() ];
        }

        return [ 'success' => true ];
    }
}
