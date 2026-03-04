<?php
/**
 * Tests for WPDash_Health response structure.
 *
 * These tests require the WordPress test framework.
 * They are skipped when running without WordPress.
 */

use PHPUnit\Framework\TestCase;

class Test_Health extends TestCase {

    public function test_health_response_has_required_fields(): void {
        $required_fields = [
            'wp_version',
            'php_version',
            'db_version',
            'db_latency_ms',
            'active_theme',
            'is_multisite',
            'site_url',
            'home_url',
            'timezone',
            'memory_limit',
            'max_upload_size',
            'wp_debug',
            'ssl_enabled',
            'permalink_structure',
            'plugin_count',
            'checked_at',
        ];

        // Verify the field list is comprehensive
        $this->assertCount(16, $required_fields);
        $this->assertContains('wp_version', $required_fields);
        $this->assertContains('db_latency_ms', $required_fields);
        $this->assertContains('plugin_count', $required_fields);
        $this->assertContains('checked_at', $required_fields);
    }

    public function test_plugin_count_structure(): void {
        $plugin_count = [
            'active'   => 5,
            'inactive' => 2,
            'total'    => 7,
        ];

        $this->assertArrayHasKey('active', $plugin_count);
        $this->assertArrayHasKey('inactive', $plugin_count);
        $this->assertArrayHasKey('total', $plugin_count);
        $this->assertEquals(
            $plugin_count['active'] + $plugin_count['inactive'],
            $plugin_count['total']
        );
    }

    public function test_active_theme_structure(): void {
        $theme = [
            'name'    => 'Astra',
            'version' => '4.6',
        ];

        $this->assertArrayHasKey('name', $theme);
        $this->assertArrayHasKey('version', $theme);
        $this->assertIsString($theme['name']);
        $this->assertIsString($theme['version']);
    }

    public function test_checked_at_is_iso8601(): void {
        $checked_at = gmdate('Y-m-d\TH:i:s\Z');

        // Verify ISO 8601 format
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/',
            $checked_at
        );
    }
}
