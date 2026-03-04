<?php
/**
 * PHPUnit bootstrap for WP Dash Bridge tests.
 *
 * Loads WordPress test framework if available, otherwise provides stubs.
 */

// Try to load WordPress test suite
$wp_tests_dir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';

if (file_exists($wp_tests_dir . '/includes/functions.php')) {
    require_once $wp_tests_dir . '/includes/functions.php';

    tests_add_filter('muplugins_loaded', function () {
        require dirname(__DIR__) . '/wp-dash-bridge.php';
    });

    require $wp_tests_dir . '/includes/bootstrap.php';
} else {
    // Minimal stubs for unit testing without WordPress
    if (!defined('ABSPATH')) {
        define('ABSPATH', '/tmp/wordpress/');
    }

    // Stub WP_Error
    if (!class_exists('WP_Error')) {
        class WP_Error {
            private $code;
            private $message;
            private $data;

            public function __construct($code = '', $message = '', $data = '') {
                $this->code    = $code;
                $this->message = $message;
                $this->data    = $data;
            }

            public function get_error_code() {
                return $this->code;
            }

            public function get_error_message() {
                return $this->message;
            }

            public function get_error_data() {
                return $this->data;
            }
        }
    }

    // Stub WP_REST_Request
    if (!class_exists('WP_REST_Request')) {
        class WP_REST_Request {
            private $headers = [];
            private $params = [];

            public function set_header($key, $value) {
                $this->headers[strtolower($key)] = $value;
            }

            public function get_header($key) {
                return $this->headers[strtolower($key)] ?? null;
            }

            public function set_param($key, $value) {
                $this->params[$key] = $value;
            }

            public function get_param($key) {
                return $this->params[$key] ?? null;
            }
        }
    }

    // Stub functions
    if (!function_exists('get_option')) {
        function get_option($key, $default = false) {
            global $wp_options;
            return $wp_options[$key] ?? $default;
        }
    }

    if (!function_exists('update_option')) {
        function update_option($key, $value) {
            global $wp_options;
            $wp_options[$key] = $value;
        }
    }

    if (!function_exists('is_wp_error')) {
        function is_wp_error($thing) {
            return $thing instanceof WP_Error;
        }
    }

    // Load plugin classes
    require_once dirname(__DIR__) . '/includes/class-auth.php';
}
