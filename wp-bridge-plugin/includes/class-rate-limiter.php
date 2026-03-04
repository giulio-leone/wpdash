<?php
/**
 * Transient-based rate limiter for WP Dash Bridge REST API.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Rate_Limiter {

    /** @var int Maximum requests per window. */
    private $max_requests;

    /** @var int Window duration in seconds. */
    private $window_seconds;

    /**
     * @param int $max_requests  Max requests per window (default 60).
     * @param int $window_seconds Window in seconds (default 60).
     */
    public function __construct(int $max_requests = 60, int $window_seconds = 60) {
        $this->max_requests   = $max_requests;
        $this->window_seconds = $window_seconds;
    }

    /**
     * Check whether the current request should be rate-limited.
     *
     * @return bool|WP_Error True if allowed, WP_Error if limit exceeded.
     */
    public function check() {
        $ip  = $this->get_client_ip();
        $key = 'wpdash_rl_' . md5($ip);

        $data = get_transient($key);

        if ($data === false) {
            set_transient($key, ['count' => 1, 'start' => time()], $this->window_seconds);
            return true;
        }

        if ($data['count'] >= $this->max_requests) {
            $retry_after = $this->window_seconds - (time() - $data['start']);
            return new WP_Error(
                'rate_limit_exceeded',
                'Too many requests. Please try again later.',
                ['status' => 429, 'retry_after' => max(1, $retry_after)]
            );
        }

        $data['count']++;
        $remaining_ttl = $this->window_seconds - (time() - $data['start']);
        set_transient($key, $data, max(1, $remaining_ttl));

        return true;
    }

    /**
     * Get the client IP address.
     *
     * @return string
     */
    private function get_client_ip(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // X-Forwarded-For may contain multiple IPs — take the first
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }
}
