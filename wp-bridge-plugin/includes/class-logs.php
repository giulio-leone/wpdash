<?php
/**
 * Logs endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Logs {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    /**
     * Register REST routes.
     */
    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/logs', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle'],
            'permission_callback' => [$this->auth, 'check_permission'],
            'args'                => [
                'lines' => [
                    'default'           => 100,
                    'type'              => 'integer',
                    'minimum'           => 1,
                    'maximum'           => 1000,
                    'sanitize_callback' => 'absint',
                ],
                'level' => [
                    'default'           => 'all',
                    'type'              => 'string',
                    'enum'              => ['all', 'error', 'warning', 'notice', 'deprecated'],
                    'validate_callback' => function ($value) {
                        return in_array($value, ['all', 'error', 'warning', 'notice', 'deprecated'], true);
                    },
                ],
            ],
        ]);
    }

    /**
     * Handle the logs request.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function handle(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $max_lines    = $request->get_param('lines');
        $level_filter = $request->get_param('level');

        $log_path = ini_get('error_log');
        if (!$log_path || !file_exists($log_path) || !is_readable($log_path)) {
            // Fallback to WP debug log
            $log_path = WP_CONTENT_DIR . '/debug.log';
        }

        if (!file_exists($log_path) || !is_readable($log_path)) {
            return new WP_REST_Response([
                'entries'   => [],
                'log_file'  => null,
                'message'   => 'No readable log file found',
                'queried_at' => gmdate('Y-m-d\TH:i:s\Z'),
            ], 200);
        }

        $lines   = $this->tail_file($log_path, $max_lines * 3); // read extra for multi-line entries
        $entries = $this->parse_log_lines($lines, $level_filter, $max_lines);

        return new WP_REST_Response([
            'entries'    => $entries,
            'log_file'   => basename($log_path),
            'total'      => count($entries),
            'queried_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ], 200);
    }

    /**
     * Read last N lines of a file efficiently.
     *
     * @param string $filepath
     * @param int    $lines
     * @return array
     */
    private function tail_file(string $filepath, int $lines): array {
        $file = new SplFileObject($filepath, 'r');
        $file->seek(PHP_INT_MAX);
        $total = $file->key();

        $start = max(0, $total - $lines);
        $result = [];

        $file->seek($start);
        while (!$file->eof()) {
            $line = $file->current();
            if (trim($line) !== '') {
                $result[] = trim($line);
            }
            $file->next();
        }

        return $result;
    }

    /**
     * Parse raw log lines into structured entries.
     *
     * @param array  $lines
     * @param string $level_filter
     * @param int    $max
     * @return array
     */
    private function parse_log_lines(array $lines, string $level_filter, int $max): array {
        $entries = [];
        // PHP error log pattern: [DD-Mon-YYYY HH:MM:SS TZ] PHP Level: message in file on line N
        $pattern = '/^\[([^\]]+)\]\s+PHP\s+(Fatal error|Warning|Notice|Deprecated|Parse error|Strict Standards):\s+(.+?)(?:\s+in\s+(.+?)\s+on\s+line\s+(\d+))?$/i';

        foreach ($lines as $line) {
            if (!preg_match($pattern, $line, $m)) {
                continue;
            }

            $level = $this->classify_level($m[2]);

            if ($level_filter !== 'all' && $level !== $level_filter) {
                continue;
            }

            $entries[] = [
                'timestamp' => $m[1],
                'level'     => $level,
                'type'      => $m[2],
                'message'   => $m[3],
                'file'      => $m[4] ?? null,
                'line'      => isset($m[5]) ? (int) $m[5] : null,
            ];

            if (count($entries) >= $max) {
                break;
            }
        }

        return array_reverse($entries); // newest first
    }

    /**
     * Classify a PHP error type string to a simplified level.
     *
     * @param string $type
     * @return string
     */
    private function classify_level(string $type): string {
        $type = strtolower($type);
        if (strpos($type, 'fatal') !== false || strpos($type, 'parse') !== false) {
            return 'error';
        }
        if (strpos($type, 'warning') !== false || strpos($type, 'strict') !== false) {
            return 'warning';
        }
        if (strpos($type, 'notice') !== false) {
            return 'notice';
        }
        if (strpos($type, 'deprecated') !== false) {
            return 'deprecated';
        }
        return 'error';
    }
}
