<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Backup_Manager {

    public function get_status(): array {
        $result = [
            'plugin'         => null,
            'last_backup_at' => null,
            'size'           => null,
            'status'         => 'no_plugin',
        ];

        // UpdraftPlus
        if ( class_exists( 'UpdraftPlus' ) || is_plugin_active( 'updraftplus/updraftplus.php' ) ) {
            $last = get_option( 'updraft_last_backup' );
            if ( ! $last ) {
                $last = get_option( 'updraftplus_lastbackup' );
            }

            $result['plugin'] = 'UpdraftPlus';
            $result['status'] = 'ok';

            if ( is_array( $last ) && ! empty( $last['backup_time'] ) ) {
                $result['last_backup_at'] = date( 'Y-m-d H:i:s', (int) $last['backup_time'] );
            } elseif ( is_numeric( $last ) ) {
                $result['last_backup_at'] = date( 'Y-m-d H:i:s', (int) $last );
            }

            // Estimate size from backup files
            $backup_dir = WP_CONTENT_DIR . '/updraft';
            if ( is_dir( $backup_dir ) ) {
                $result['size'] = $this->dir_size( $backup_dir );
            }
        }

        // BackWPup
        if ( $result['status'] === 'no_plugin' && class_exists( 'BackWPup' ) ) {
            $result['plugin'] = 'BackWPup';
            $result['status'] = 'ok';

            $jobs = get_option( 'backwpup_jobs', [] );
            foreach ( $jobs as $job ) {
                if ( ! empty( $job['lastrun'] ) ) {
                    $result['last_backup_at'] = date( 'Y-m-d H:i:s', (int) $job['lastrun'] );
                    break;
                }
            }
        }

        // Duplicator
        if ( $result['status'] === 'no_plugin' && class_exists( 'DUP_Package' ) ) {
            $result['plugin'] = 'Duplicator';
            $result['status'] = 'ok';
        }

        return $result;
    }

    private function dir_size( string $dir ): string {
        $size = 0;
        foreach ( new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $dir ) ) as $file ) {
            if ( $file->isFile() ) {
                $size += $file->getSize();
            }
        }

        if ( $size > 1073741824 ) {
            return round( $size / 1073741824, 2 ) . ' GB';
        }
        if ( $size > 1048576 ) {
            return round( $size / 1048576, 2 ) . ' MB';
        }
        return round( $size / 1024, 2 ) . ' KB';
    }
}
