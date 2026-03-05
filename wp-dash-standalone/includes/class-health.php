<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Health {

    public function get_health_data(): array {
        global $wpdb;

        $start = microtime( true );
        $wpdb->get_var( 'SELECT 1' );
        $db_latency = round( ( microtime( true ) - $start ) * 1000, 2 );

        $health_score = $this->calculate_health_score();

        return [
            'wp_version'           => get_bloginfo( 'version' ),
            'php_version'          => PHP_VERSION,
            'db_version'           => $wpdb->db_version(),
            'db_latency_ms'        => $db_latency,
            'memory_limit'         => ini_get( 'memory_limit' ),
            'upload_max_filesize'  => ini_get( 'upload_max_filesize' ),
            'active_theme'         => wp_get_theme()->get( 'Name' ),
            'active_plugins_count' => count( get_option( 'active_plugins', [] ) ),
            'site_url'             => get_site_url(),
            'admin_email'          => get_option( 'admin_email' ),
            'timezone'             => get_option( 'timezone_string' ) ?: get_option( 'gmt_offset' ) . ' UTC',
            'language'             => get_locale(),
            'health_score'         => $health_score,
        ];
    }

    private function calculate_health_score(): int {
        $score = 100;

        // Deduct for outdated PHP
        $php = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
        if ( version_compare( $php, '8.0', '<' ) ) {
            $score -= 15;
        } elseif ( version_compare( $php, '8.1', '<' ) ) {
            $score -= 5;
        }

        // Deduct for outdated WordPress
        $wp_version = get_bloginfo( 'version' );
        if ( version_compare( $wp_version, '6.0', '<' ) ) {
            $score -= 15;
        } elseif ( version_compare( $wp_version, '6.4', '<' ) ) {
            $score -= 5;
        }

        // Deduct if debug mode is on
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            $score -= 5;
        }

        // Deduct if file editing is enabled
        if ( ! defined( 'DISALLOW_FILE_EDIT' ) || ! DISALLOW_FILE_EDIT ) {
            $score -= 5;
        }

        return max( 0, $score );
    }
}
