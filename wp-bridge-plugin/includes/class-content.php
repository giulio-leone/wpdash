<?php
/**
 * Content (Posts & Pages) endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_Content {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/content', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_content'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/content/manage', [
            'methods'             => 'POST',
            'callback'            => [$this, 'manage_content'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    public function get_content(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        $type  = sanitize_text_field($request->get_param('type') ?? 'all');
        $limit = min(intval($request->get_param('limit') ?? 50), 100);

        switch ($type) {
            case 'posts':
                $post_types = ['post'];
                break;
            case 'pages':
                $post_types = ['page'];
                break;
            default:
                $post_types = ['post', 'page'];
        }

        $posts = get_posts([
            'post_type'   => $post_types,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'numberposts' => $limit,
            'orderby'     => 'modified',
            'order'       => 'DESC',
        ]);

        $result = [];
        foreach ($posts as $post) {
            $result[] = [
                'id'            => $post->ID,
                'title'         => $post->post_title ?: '(no title)',
                'type'          => $post->post_type,
                'status'        => $post->post_status,
                'slug'          => $post->post_name,
                'modified_at'   => $post->post_modified_gmt . 'Z',
                'published_at'  => $post->post_date_gmt !== '0000-00-00 00:00:00' ? $post->post_date_gmt . 'Z' : null,
                'author'        => get_the_author_meta('display_name', $post->post_author),
                'url'           => get_permalink($post->ID),
                'comment_count' => intval($post->comment_count),
            ];
        }

        return new WP_REST_Response($result, 200);
    }

    public function manage_content(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;

        $action  = sanitize_text_field($request->get_param('action') ?? '');
        $post_id = intval($request->get_param('post_id') ?? 0);

        if (!$post_id) {
            return new WP_Error('missing_post_id', 'post_id is required', ['status' => 400]);
        }

        $post = get_post($post_id);
        if (!$post || !in_array($post->post_type, ['post', 'page'], true)) {
            return new WP_Error('post_not_found', 'Post or page not found', ['status' => 404]);
        }

        switch ($action) {
            case 'publish':
                wp_update_post(['ID' => $post_id, 'post_status' => 'publish']);
                return new WP_REST_Response(['message' => 'Published', 'post_id' => $post_id], 200);

            case 'draft':
                wp_update_post(['ID' => $post_id, 'post_status' => 'draft']);
                return new WP_REST_Response(['message' => 'Set to draft', 'post_id' => $post_id], 200);

            case 'private':
                wp_update_post(['ID' => $post_id, 'post_status' => 'private']);
                return new WP_REST_Response(['message' => 'Set to private', 'post_id' => $post_id], 200);

            case 'trash':
                wp_trash_post($post_id);
                return new WP_REST_Response(['message' => 'Moved to trash', 'post_id' => $post_id], 200);

            case 'delete':
                wp_delete_post($post_id, true);
                return new WP_REST_Response(['message' => 'Permanently deleted', 'post_id' => $post_id], 200);

            default:
                return new WP_Error('invalid_action', 'Invalid action. Use: publish, draft, private, trash, delete', ['status' => 400]);
        }
    }
}
