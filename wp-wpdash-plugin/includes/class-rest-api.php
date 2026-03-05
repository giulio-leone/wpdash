<?php
/**
 * Internal REST API: /wp-json/wp-dash/v1/*
 *
 * All endpoints require the manage_options capability and a valid WP REST nonce.
 */

defined( 'ABSPATH' ) || exit;

class WP_Dash_REST_API {

    private static $instance      = null;
    private const  NAMESPACE      = 'wp-dash/v1';
    private WP_Dash_Bridge $bridge;

    public static function get_instance(): self {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->bridge = new WP_Dash_Bridge();
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {
        // ── Sites ──────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/sites', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_sites' ],
                'permission_callback' => [ $this, 'check_permission' ],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'create_site' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'name'  => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                    'url'   => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'esc_url_raw' ],
                    'token' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                ],
            ],
        ] );

        register_rest_route( self::NAMESPACE, '/sites/(?P<id>\d+)', [
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [ $this, 'delete_site' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'id' => [ 'required' => true, 'type' => 'integer' ],
                ],
            ],
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [ $this, 'update_site' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'id'    => [ 'required' => true, 'type' => 'integer' ],
                    'name'  => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                    'url'   => [ 'type' => 'string', 'sanitize_callback' => 'esc_url_raw' ],
                    'token' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                ],
            ],
        ] );

        // ── Proxy ──────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/proxy', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'proxy_request' ],
            'permission_callback' => [ $this, 'check_permission' ],
            'args'                => [
                'site_id'  => [ 'required' => true, 'type' => 'integer' ],
                'endpoint' => [ 'required' => true, 'type' => 'string' ],
                'method'   => [
                    'required' => false,
                    'type'     => 'string',
                    'default'  => 'GET',
                    'enum'     => [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ],
                ],
                'data'     => [ 'required' => false ],
            ],
        ] );
    }

    // ── Permission callback ────────────────────────────────────────────────

    public function check_permission( WP_REST_Request $request ): bool|WP_Error {
        if ( ! current_user_can( 'manage_options' ) ) {
            return new WP_Error(
                'rest_forbidden',
                __( 'You do not have permission to access this endpoint.', 'wp-dash' ),
                [ 'status' => 403 ]
            );
        }
        return true;
    }

    // ── Sites endpoints ────────────────────────────────────────────────────

    public function get_sites( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'dash_sites';
        $sites = $wpdb->get_results( "SELECT id, name, url, created_at FROM {$table} ORDER BY id ASC", ARRAY_A );
        return rest_ensure_response( $sites );
    }

    public function create_site( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        global $wpdb;
        $table  = $wpdb->prefix . 'dash_sites';
        $result = $wpdb->insert(
            $table,
            [
                'name'  => $request->get_param( 'name' ),
                'url'   => $request->get_param( 'url' ),
                'token' => $request->get_param( 'token' ),
            ],
            [ '%s', '%s', '%s' ]
        );

        if ( false === $result ) {
            return new WP_Error( 'db_error', __( 'Failed to insert site.', 'wp-dash' ), [ 'status' => 500 ] );
        }

        $site = $wpdb->get_row(
            $wpdb->prepare( "SELECT id, name, url, created_at FROM {$table} WHERE id = %d", $wpdb->insert_id ),
            ARRAY_A
        );

        $response = rest_ensure_response( $site );
        $response->set_status( 201 );
        return $response;
    }

    public function delete_site( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        global $wpdb;
        $table  = $wpdb->prefix . 'dash_sites';
        $id     = (int) $request->get_param( 'id' );
        $result = $wpdb->delete( $table, [ 'id' => $id ], [ '%d' ] );

        if ( false === $result ) {
            return new WP_Error( 'db_error', __( 'Failed to delete site.', 'wp-dash' ), [ 'status' => 500 ] );
        }

        if ( 0 === $result ) {
            return new WP_Error( 'not_found', __( 'Site not found.', 'wp-dash' ), [ 'status' => 404 ] );
        }

        return rest_ensure_response( [ 'deleted' => true, 'id' => $id ] );
    }

    public function update_site( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'dash_sites';
        $id    = (int) $request->get_param( 'id' );

        $data   = [];
        $format = [];

        foreach ( [ 'name' => '%s', 'url' => '%s', 'token' => '%s' ] as $field => $fmt ) {
            $value = $request->get_param( $field );
            if ( null !== $value ) {
                $data[ $field ] = $value;
                $format[]       = $fmt;
            }
        }

        if ( empty( $data ) ) {
            return new WP_Error( 'no_data', __( 'No fields to update.', 'wp-dash' ), [ 'status' => 400 ] );
        }

        $result = $wpdb->update( $table, $data, [ 'id' => $id ], $format, [ '%d' ] );

        if ( false === $result ) {
            return new WP_Error( 'db_error', __( 'Failed to update site.', 'wp-dash' ), [ 'status' => 500 ] );
        }

        $site = $wpdb->get_row(
            $wpdb->prepare( "SELECT id, name, url, created_at FROM {$table} WHERE id = %d", $id ),
            ARRAY_A
        );

        if ( ! $site ) {
            return new WP_Error( 'not_found', __( 'Site not found.', 'wp-dash' ), [ 'status' => 404 ] );
        }

        return rest_ensure_response( $site );
    }

    // ── Proxy endpoint ─────────────────────────────────────────────────────

    public function proxy_request( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        global $wpdb;
        $table   = $wpdb->prefix . 'dash_sites';
        $site_id = (int) $request->get_param( 'site_id' );

        $site = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $site_id ),
            ARRAY_A
        );

        if ( ! $site ) {
            return new WP_Error( 'not_found', __( 'Site not found.', 'wp-dash' ), [ 'status' => 404 ] );
        }

        $endpoint = $request->get_param( 'endpoint' );
        $method   = strtoupper( $request->get_param( 'method' ) ?? 'GET' );
        $data     = $request->get_param( 'data' );

        $result = $this->bridge->request(
            $site['url'],
            $site['token'],
            $endpoint,
            $method,
            is_array( $data ) ? $data : null
        );

        if ( is_wp_error( $result ) ) {
            $status = $result->get_error_data()['status'] ?? 502;
            return new WP_Error( $result->get_error_code(), $result->get_error_message(), [ 'status' => $status ] );
        }

        return rest_ensure_response( $result );
    }
}
