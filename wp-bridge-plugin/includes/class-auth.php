<?php
/**
 * Token-based authentication for WP Dash Bridge REST API.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Auth {

    /**
     * Validate a REST request by checking the Bearer token.
     *
     * @param WP_REST_Request $request
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function validate_request(WP_REST_Request $request) {
        $header = $request->get_header('Authorization');

        if (!$header || strpos($header, 'Bearer ') !== 0) {
            return new WP_Error(
                'unauthorized',
                'Missing or invalid Authorization header',
                ['status' => 401]
            );
        }

        $token = substr($header, 7);
        $stored_hash = get_option('wpdash_bridge_token_hash');

        if (!$stored_hash) {
            return new WP_Error(
                'not_configured',
                'Bridge token not configured',
                ['status' => 500]
            );
        }

        if (!hash_equals($stored_hash, hash('sha256', $token))) {
            return new WP_Error(
                'forbidden',
                'Invalid token',
                ['status' => 403]
            );
        }

        return true;
    }

    /**
     * Permission callback for REST routes.
     *
     * @param WP_REST_Request $request
     * @return bool|WP_Error
     */
    public function check_permission(WP_REST_Request $request) {
        return $this->validate_request($request);
    }
}
