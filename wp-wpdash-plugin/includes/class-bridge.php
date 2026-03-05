<?php
/**
 * Outbound HTTP requests to connected (bridge) WordPress sites.
 */

defined( 'ABSPATH' ) || exit;

class WP_Dash_Bridge {

    /**
     * Perform an HTTP request to a connected site.
     *
     * @param string      $site_url  Base URL of the remote site (e.g. https://example.com).
     * @param string      $token     Bearer token for authentication.
     * @param string      $endpoint  REST endpoint path, e.g. /health or /plugins.
     * @param string      $method    HTTP method: GET, POST, PUT, DELETE.
     * @param array|null  $body      Optional request body (will be JSON-encoded).
     *
     * @return array|WP_Error Decoded JSON response array, or WP_Error on failure.
     */
    public function request(
        string $site_url,
        string $token,
        string $endpoint,
        string $method = 'GET',
        ?array $body = null
    ) {
        $url  = trailingslashit( $site_url ) . 'wp-json/wpdash/v1' . $endpoint;
        $args = [
            'method'  => strtoupper( $method ),
            'timeout' => 30,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
        ];

        if ( null !== $body ) {
            $args['body'] = wp_json_encode( $body );
        }

        $response = wp_remote_request( $url, $args );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $raw_body    = wp_remote_retrieve_body( $response );
        $decoded     = json_decode( $raw_body, true );

        if ( $status_code >= 400 ) {
            $message = isset( $decoded['message'] ) ? $decoded['message'] : 'Remote site returned HTTP ' . $status_code;
            return new WP_Error( 'bridge_error', $message, [ 'status' => $status_code ] );
        }

        if ( null === $decoded && ! empty( $raw_body ) ) {
            return new WP_Error( 'bridge_json_error', 'Failed to decode JSON response from remote site.' );
        }

        return $decoded ?? [];
    }
}
