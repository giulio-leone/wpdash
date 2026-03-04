<?php
/**
 * Tests for WPDash_Auth.
 */

use PHPUnit\Framework\TestCase;

class Test_Auth extends TestCase {

    protected function setUp(): void {
        global $wp_options;
        $wp_options = [];
    }

    public function test_missing_authorization_header(): void {
        $auth    = new WPDash_Auth();
        $request = new WP_REST_Request();

        $result = $auth->validate_request($request);

        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertEquals('unauthorized', $result->get_error_code());
    }

    public function test_invalid_authorization_format(): void {
        $auth    = new WPDash_Auth();
        $request = new WP_REST_Request();
        $request->set_header('Authorization', 'Basic abc123');

        $result = $auth->validate_request($request);

        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertEquals('unauthorized', $result->get_error_code());
    }

    public function test_no_stored_token(): void {
        $auth    = new WPDash_Auth();
        $request = new WP_REST_Request();
        $request->set_header('Authorization', 'Bearer some-token');

        $result = $auth->validate_request($request);

        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertEquals('not_configured', $result->get_error_code());
    }

    public function test_invalid_token(): void {
        global $wp_options;
        $wp_options['wpdash_bridge_token_hash'] = hash('sha256', 'correct-token');

        $auth    = new WPDash_Auth();
        $request = new WP_REST_Request();
        $request->set_header('Authorization', 'Bearer wrong-token');

        $result = $auth->validate_request($request);

        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertEquals('forbidden', $result->get_error_code());
    }

    public function test_valid_token(): void {
        global $wp_options;
        $token = 'my-secret-token-123';
        $wp_options['wpdash_bridge_token_hash'] = hash('sha256', $token);

        $auth    = new WPDash_Auth();
        $request = new WP_REST_Request();
        $request->set_header('Authorization', 'Bearer ' . $token);

        $result = $auth->validate_request($request);

        $this->assertTrue($result);
    }

    public function test_check_permission_delegates_to_validate(): void {
        global $wp_options;
        $token = 'perm-test-token';
        $wp_options['wpdash_bridge_token_hash'] = hash('sha256', $token);

        $auth    = new WPDash_Auth();
        $request = new WP_REST_Request();
        $request->set_header('Authorization', 'Bearer ' . $token);

        $this->assertTrue($auth->check_permission($request));
    }
}
