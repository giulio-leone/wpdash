<?php
/**
 * Backup status endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Backup {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    /**
     * Known backup plugin directories and identifiers.
     */
    private const BACKUP_SOURCES = [
        'updraftplus'  => [
            'dir'    => 'updraft',
            'option' => 'updraft_lastmessage',
        ],
        'backwpup'     => [
            'dir'    => 'backwpup-*',
            'option' => 'backwpup_cfg_jobstepretry',
        ],
        'duplicator'   => [
            'dir'    => 'backups-dup-lite',
            'option' => 'duplicator_settings',
        ],
        'backupbuddy'  => [
            'dir'    => 'backupbuddy_backups',
            'option' => 'pb_backupbuddy',
        ],
        'wpvivid'      => [
            'dir'    => 'wpvivid',
            'option' => 'wpvivid_common_setting',
        ],
    ];

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    /**
     * Register REST routes.
     */
    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/backup/status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    /**
     * Handle backup status request.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function handle(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $result = [
            'backup_plugin'     => null,
            'last_backup_at'    => null,
            'archive_size_bytes' => null,
            'backup_count'      => 0,
            'checked_at'        => gmdate('Y-m-d\TH:i:s\Z'),
        ];

        $content_dir = WP_CONTENT_DIR;

        foreach (self::BACKUP_SOURCES as $plugin_name => $source) {
            $dir_pattern = $content_dir . '/' . $source['dir'];
            $dirs        = glob($dir_pattern, GLOB_ONLYDIR);

            if (empty($dirs)) {
                continue;
            }

            $backup_dir = $dirs[0];
            $backups    = $this->find_backup_files($backup_dir);

            if (empty($backups)) {
                continue;
            }

            // Sort by modification time descending
            usort($backups, function ($a, $b) {
                return filemtime($b) - filemtime($a);
            });

            $latest = $backups[0];

            $result['backup_plugin']      = $plugin_name;
            $result['last_backup_at']     = gmdate('Y-m-d\TH:i:s\Z', filemtime($latest));
            $result['archive_size_bytes'] = filesize($latest);
            $result['backup_count']       = count($backups);

            break; // Use the first detected plugin
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * Find backup archive files in a directory.
     *
     * @param string $dir
     * @return array File paths.
     */
    private function find_backup_files(string $dir): array {
        $extensions = ['zip', 'gz', 'tar', 'tar.gz', 'sql', 'sql.gz'];
        $files      = [];

        if (!is_dir($dir) || !is_readable($dir)) {
            return $files;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }
            $name = $file->getFilename();
            foreach ($extensions as $ext) {
                if (substr($name, -strlen($ext) - 1) === '.' . $ext) {
                    $files[] = $file->getPathname();
                    break;
                }
            }
        }

        return $files;
    }
}
