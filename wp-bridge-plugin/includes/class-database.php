<?php
/**
 * Database management endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Database {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/database/status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_status'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/database/optimize', [
            'methods'             => 'POST',
            'callback'            => [$this, 'optimize'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/database/cleanup', [
            'methods'             => 'POST',
            'callback'            => [$this, 'cleanup'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    public function get_status(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        global $wpdb;

        $tables     = $wpdb->get_results('SHOW TABLE STATUS');
        $result     = [];
        $total_size = 0.0;

        foreach ($tables as $table) {
            $data_mb  = (float) $table->Data_length / 1024 / 1024;
            $index_mb = (float) $table->Index_length / 1024 / 1024;
            $total_mb = $data_mb + $index_mb;
            $total_size += $total_mb;

            $result[] = [
                'name'          => $table->Name,
                'rows'          => intval($table->Rows),
                'data_size_mb'  => round($data_mb, 3),
                'index_size_mb' => round($index_mb, 3),
                'total_size_mb' => round($total_mb, 3),
                'engine'        => $table->Engine,
                'collation'     => $table->Collation,
                'auto_increment'=> $table->Auto_increment,
            ];
        }

        // Sort largest first
        usort($result, fn($a, $b) => $b['total_size_mb'] <=> $a['total_size_mb']);

        // Pending cleanup counts
        $transients_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->options}
             WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'"
        );
        $spam_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->comments} WHERE comment_approved = 'spam'"
        );
        $revisions_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'revision'"
        );
        $auto_drafts_count = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_status = 'auto-draft'"
        );

        return new WP_REST_Response([
            'tables'           => $result,
            'total_tables'     => count($result),
            'total_size_mb'    => round($total_size, 2),
            'db_version'       => $wpdb->db_version(),
            'charset'          => $wpdb->charset,
            'pending_cleanup'  => [
                'transients'   => $transients_count,
                'spam_comments'=> $spam_count,
                'revisions'    => $revisions_count,
                'auto_drafts'  => $auto_drafts_count,
                'total'        => $transients_count + $spam_count + $revisions_count + $auto_drafts_count,
            ],
            'checked_at'       => gmdate('Y-m-d\TH:i:s\Z'),
        ], 200);
    }

    public function optimize(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        global $wpdb;

        $tables    = $wpdb->get_col('SHOW TABLES');
        $optimized = 0;
        $errors    = [];

        foreach ($tables as $table) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $result = $wpdb->query("OPTIMIZE TABLE `{$table}`");
            if ($result !== false) {
                $optimized++;
            } else {
                $errors[] = $table;
            }
        }

        return new WP_REST_Response([
            'message'          => 'Optimization complete',
            'tables_optimized' => $optimized,
            'tables_failed'    => count($errors),
        ], 200);
    }

    public function cleanup(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        global $wpdb;

        $action = sanitize_text_field($request->get_param('action') ?? '');

        switch ($action) {
            case 'clean_transients':
                $count = (int) $wpdb->query(
                    "DELETE FROM {$wpdb->options}
                     WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'"
                );
                return new WP_REST_Response(['message' => 'Transients cleaned', 'rows_deleted' => $count], 200);

            case 'clean_spam_comments':
                $count = (int) $wpdb->query(
                    "DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'"
                );
                // Clean orphan comment meta
                $wpdb->query(
                    "DELETE FROM {$wpdb->commentmeta}
                     WHERE comment_id NOT IN (SELECT comment_ID FROM {$wpdb->comments})"
                );
                return new WP_REST_Response(['message' => 'Spam comments cleaned', 'rows_deleted' => $count], 200);

            case 'clean_post_revisions':
                $count = (int) $wpdb->query(
                    "DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'"
                );
                // Clean orphan post meta
                $wpdb->query(
                    "DELETE FROM {$wpdb->postmeta}
                     WHERE post_id NOT IN (SELECT ID FROM {$wpdb->posts})"
                );
                return new WP_REST_Response(['message' => 'Post revisions cleaned', 'rows_deleted' => $count], 200);

            case 'clean_auto_drafts':
                $count = (int) $wpdb->query(
                    "DELETE FROM {$wpdb->posts} WHERE post_status = 'auto-draft'"
                );
                return new WP_REST_Response(['message' => 'Auto-drafts cleaned', 'rows_deleted' => $count], 200);

            case 'clean_all':
                $total = 0;
                $total += (int) $wpdb->query(
                    "DELETE FROM {$wpdb->options}
                     WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'"
                );
                $total += (int) $wpdb->query(
                    "DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'"
                );
                $total += (int) $wpdb->query(
                    "DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'"
                );
                $total += (int) $wpdb->query(
                    "DELETE FROM {$wpdb->posts} WHERE post_status = 'auto-draft'"
                );
                return new WP_REST_Response(['message' => 'Full cleanup complete', 'rows_deleted' => $total], 200);

            default:
                return new WP_Error(
                    'invalid_action',
                    'Invalid action. Use: clean_transients, clean_spam_comments, clean_post_revisions, clean_auto_drafts, clean_all',
                    ['status' => 400]
                );
        }
    }
}
