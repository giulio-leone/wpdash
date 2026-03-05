<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Logs_Manager {

    private function get_log_path(): string {
        $path = ini_get( 'error_log' );

        if ( ! $path || ! file_exists( $path ) ) {
            $path = WP_CONTENT_DIR . '/debug.log';
        }

        return $path;
    }

    public function get_logs( int $lines = 200 ): array {
        $log_path = $this->get_log_path();

        if ( ! file_exists( $log_path ) || ! is_readable( $log_path ) ) {
            return [
                'success'  => false,
                'message'  => 'Log file not found or not readable: ' . $log_path,
                'log_path' => $log_path,
                'entries'  => [],
            ];
        }

        $raw_lines = $this->tail( $log_path, $lines );
        $entries   = [];

        foreach ( $raw_lines as $line ) {
            $line = trim( $line );
            if ( empty( $line ) ) {
                continue;
            }
            $entries[] = $this->parse_line( $line );
        }

        return [
            'success'  => true,
            'log_path' => $log_path,
            'entries'  => array_reverse( $entries ),
        ];
    }

    private function tail( string $path, int $lines ): array {
        $file    = new SplFileObject( $path, 'r' );
        $file->seek( PHP_INT_MAX );
        $total = $file->key();

        $start = max( 0, $total - $lines );
        $file->seek( $start );

        $result = [];
        while ( ! $file->eof() ) {
            $result[] = $file->current();
            $file->next();
        }

        return $result;
    }

    private function parse_line( string $line ): array {
        $timestamp = '';
        $level     = 'notice';
        $message   = $line;

        // PHP error log format: [DD-Mon-YYYY HH:MM:SS UTC] PHP Notice: ...
        if ( preg_match( '/^\[([^\]]+)\]\s+(.+)$/', $line, $matches ) ) {
            $timestamp = $matches[1];
            $rest      = $matches[2];

            if ( stripos( $rest, 'PHP Fatal' ) !== false ) {
                $level = 'fatal';
            } elseif ( stripos( $rest, 'PHP Error' ) !== false ) {
                $level = 'error';
            } elseif ( stripos( $rest, 'PHP Warning' ) !== false ) {
                $level = 'warning';
            } elseif ( stripos( $rest, 'PHP Notice' ) !== false ) {
                $level = 'notice';
            } elseif ( stripos( $rest, 'PHP Deprecated' ) !== false ) {
                $level = 'deprecated';
            }

            $message = $rest;
        }

        return [
            'timestamp' => $timestamp,
            'level'     => $level,
            'message'   => $message,
        ];
    }

    public function clear(): bool {
        $log_path = $this->get_log_path();

        if ( ! file_exists( $log_path ) ) {
            return true;
        }

        return (bool) file_put_contents( $log_path, '' );
    }
}
