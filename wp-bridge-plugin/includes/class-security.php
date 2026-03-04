<?php
/**
 * Security integrity audit endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Security {

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
        register_rest_route('wpdash/v1', '/security/integrity', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    /**
     * Handle the security integrity check.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function handle(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $findings = [];
        $wp_version = get_bloginfo('version');

        // Fetch official checksums
        $checksums = $this->get_core_checksums($wp_version);

        if (is_wp_error($checksums)) {
            $findings[] = [
                'type'     => 'error',
                'severity' => 'warning',
                'message'  => 'Could not fetch core checksums: ' . $checksums->get_error_message(),
                'file'     => null,
            ];
        } else {
            // Verify core files against checksums
            foreach ($checksums as $file => $checksum) {
                $filepath = ABSPATH . $file;

                if (!file_exists($filepath)) {
                    $findings[] = [
                        'type'     => 'missing',
                        'severity' => 'warning',
                        'message'  => 'Core file missing',
                        'file'     => $file,
                    ];
                    continue;
                }

                if (md5_file($filepath) !== $checksum) {
                    $findings[] = [
                        'type'     => 'modified',
                        'severity' => 'critical',
                        'message'  => 'Core file has been modified',
                        'file'     => $file,
                    ];
                }
            }
        }

        // Check for unknown files in wp-admin and wp-includes
        $unknown = $this->find_unknown_files($checksums ?: []);
        foreach ($unknown as $file) {
            $findings[] = [
                'type'     => 'unknown',
                'severity' => 'warning',
                'message'  => 'Unknown file in core directory',
                'file'     => $file,
            ];
        }

        // Check .htaccess
        $htaccess = ABSPATH . '.htaccess';
        if (file_exists($htaccess)) {
            $content = file_get_contents($htaccess);
            if ($content !== false) {
                // Flag suspicious patterns
                $suspicious = ['eval(', 'base64_decode(', 'exec(', 'system(', 'passthru('];
                foreach ($suspicious as $pattern) {
                    if (stripos($content, $pattern) !== false) {
                        $findings[] = [
                            'type'     => 'suspicious',
                            'severity' => 'critical',
                            'message'  => "Suspicious pattern found in .htaccess: $pattern",
                            'file'     => '.htaccess',
                        ];
                    }
                }
            }
        }

        return new WP_REST_Response([
            'wp_version'    => $wp_version,
            'findings'      => $findings,
            'total_checked' => is_array($checksums) ? count($checksums) : 0,
            'checked_at'    => gmdate('Y-m-d\TH:i:s\Z'),
        ], 200);
    }

    /**
     * Fetch core checksums from WordPress.org API.
     *
     * @param string $version
     * @return array|WP_Error
     */
    private function get_core_checksums(string $version) {
        $locale   = get_locale();
        $url      = "https://api.wordpress.org/core/checksums/1.0/?version={$version}&locale={$locale}";
        $response = wp_remote_get($url, ['timeout' => 15]);

        if (is_wp_error($response)) {
            return $response;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (empty($body['checksums'])) {
            return new WP_Error('no_checksums', 'No checksums available for this version');
        }

        return $body['checksums'];
    }

    /**
     * Scan wp-admin and wp-includes for files not in the checksum list.
     *
     * @param array $checksums
     * @return array List of unknown file paths.
     */
    private function find_unknown_files(array $checksums): array {
        $unknown = [];
        $dirs    = ['wp-admin', 'wp-includes'];

        foreach ($dirs as $dir) {
            $full_path = ABSPATH . $dir;
            if (!is_dir($full_path)) {
                continue;
            }

            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($full_path, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($iterator as $file) {
                if (!$file->isFile()) {
                    continue;
                }
                $relative = str_replace(ABSPATH, '', $file->getPathname());
                $relative = str_replace('\\', '/', $relative);

                if (!isset($checksums[$relative])) {
                    $unknown[] = $relative;
                }
            }
        }

        return $unknown;
    }
}
