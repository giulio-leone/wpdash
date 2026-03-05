<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Security_Manager {

    public function check_integrity(): array {
        $wp_version = get_bloginfo( 'version' );
        $locale     = get_locale();

        $api_url  = "https://api.wordpress.org/core/checksums/1.0/?version={$wp_version}&locale={$locale}";
        $response = wp_remote_get( $api_url, [ 'timeout' => 20 ] );

        if ( is_wp_error( $response ) ) {
            return [
                'success' => false,
                'message' => $response->get_error_message(),
            ];
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( empty( $body['checksums'] ) ) {
            // Try en_US fallback
            $api_url  = "https://api.wordpress.org/core/checksums/1.0/?version={$wp_version}&locale=en_US";
            $response = wp_remote_get( $api_url, [ 'timeout' => 20 ] );
            $body     = json_decode( wp_remote_retrieve_body( $response ), true );
        }

        if ( empty( $body['checksums'] ) ) {
            return [
                'success' => false,
                'message' => 'Could not retrieve checksums from WordPress.org',
            ];
        }

        $checksums = $body['checksums'];
        $modified  = [];
        $abspath   = rtrim( ABSPATH, '/' );

        foreach ( $checksums as $file => $expected_md5 ) {
            $full_path = $abspath . '/' . $file;

            if ( ! file_exists( $full_path ) ) {
                $modified[] = [
                    'file'   => $file,
                    'status' => 'missing',
                ];
                continue;
            }

            $actual_md5 = md5_file( $full_path );
            if ( $actual_md5 !== $expected_md5 ) {
                $modified[] = [
                    'file'   => $file,
                    'status' => 'modified',
                ];
            }
        }

        return [
            'success'       => true,
            'clean'         => empty( $modified ),
            'modified'      => $modified,
            'checked_files' => count( $checksums ),
            'wp_version'    => $wp_version,
        ];
    }
}
