<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Database_Manager {

    public function get_tables(): array {
        global $wpdb;

        $tables = $wpdb->get_results( 'SHOW TABLE STATUS', ARRAY_A );
        $result = [];

        foreach ( $tables as $table ) {
            $data_size  = round( (float) $table['Data_length'] / 1024 / 1024, 3 );
            $index_size = round( (float) $table['Index_length'] / 1024 / 1024, 3 );
            $result[]   = [
                'name'       => $table['Name'],
                'rows'       => (int) $table['Rows'],
                'data_size'  => $data_size,
                'index_size' => $index_size,
                'total_size' => round( $data_size + $index_size, 3 ),
                'engine'     => $table['Engine'],
            ];
        }

        return $result;
    }

    public function get_cleanup_counts(): array {
        global $wpdb;

        return [
            'transients'  => (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'"
            ),
            'spam'        => (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->comments} WHERE comment_approved = 'spam'"
            ),
            'revisions'   => (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'revision'"
            ),
            'auto_drafts' => (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_status = 'auto-draft'"
            ),
        ];
    }

    public function cleanup( string $type ): array {
        global $wpdb;

        switch ( $type ) {
            case 'transients':
                $deleted = $wpdb->query(
                    "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'"
                );
                break;

            case 'spam':
                $deleted = $wpdb->query(
                    "DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'"
                );
                break;

            case 'revisions':
                $deleted = $wpdb->query(
                    "DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'"
                );
                break;

            case 'auto_drafts':
                $deleted = $wpdb->query(
                    "DELETE FROM {$wpdb->posts} WHERE post_status = 'auto-draft'"
                );
                break;

            default:
                return [ 'success' => false, 'message' => 'Unknown cleanup type' ];
        }

        return [ 'success' => true, 'deleted' => (int) $deleted ];
    }

    public function optimize(): array {
        global $wpdb;

        $tables = $wpdb->get_col( 'SHOW TABLES' );
        foreach ( $tables as $table ) {
            $wpdb->query( "OPTIMIZE TABLE `{$table}`" ); // phpcs:ignore
        }

        return [ 'success' => true, 'tables_optimized' => count( $tables ) ];
    }
}
