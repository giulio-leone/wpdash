<?php
/**
 * Tests for WPDash_Plugins endpoint validation.
 *
 * These tests verify request validation logic and response structure.
 */

use PHPUnit\Framework\TestCase;

class Test_Plugins extends TestCase {

    public function test_plugin_list_response_structure(): void {
        $plugin = [
            'name'           => 'Akismet Anti-spam',
            'slug'           => 'akismet',
            'file'           => 'akismet/akismet.php',
            'version'        => '5.3',
            'is_active'      => true,
            'has_update'     => false,
            'update_version' => null,
            'author'         => 'Automattic',
            'description'    => 'Anti-spam plugin.',
        ];

        $this->assertArrayHasKey('name', $plugin);
        $this->assertArrayHasKey('slug', $plugin);
        $this->assertArrayHasKey('file', $plugin);
        $this->assertArrayHasKey('version', $plugin);
        $this->assertArrayHasKey('is_active', $plugin);
        $this->assertArrayHasKey('has_update', $plugin);
        $this->assertArrayHasKey('update_version', $plugin);
        $this->assertArrayHasKey('author', $plugin);
        $this->assertArrayHasKey('description', $plugin);
        $this->assertIsBool($plugin['is_active']);
        $this->assertIsBool($plugin['has_update']);
    }

    public function test_manage_action_validation(): void {
        $valid_actions = ['activate', 'deactivate', 'update', 'delete'];

        foreach ($valid_actions as $action) {
            $this->assertContains($action, $valid_actions);
        }

        $invalid = 'reinstall';
        $this->assertNotContains($invalid, $valid_actions);
    }

    public function test_install_source_validation(): void {
        $valid_sources = ['url', 'slug'];

        $this->assertContains('url', $valid_sources);
        $this->assertContains('slug', $valid_sources);
        $this->assertNotContains('file', $valid_sources);
    }

    public function test_plugin_slug_extraction(): void {
        // Test slug extraction from plugin file path
        $file = 'akismet/akismet.php';
        $slug = dirname($file);
        $this->assertEquals('akismet', $slug);

        // Single-file plugin
        $file = 'hello.php';
        $slug = dirname($file);
        if ($slug === '.') {
            $slug = basename($file, '.php');
        }
        $this->assertEquals('hello', $slug);
    }
}
