<?php
/**
 * SEO audit endpoint for WP Dash Bridge.
 */

if (!defined('ABSPATH')) exit;

class WPDash_SEO {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    /**
     * Register REST routes.
     */
    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/seo/audit', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle'],
            'permission_callback' => [$this->auth, 'check_permission'],
            'args'                => [
                'url' => [
                    'required'          => true,
                    'type'              => 'string',
                    'validate_callback' => function ($value) {
                        return filter_var($value, FILTER_VALIDATE_URL) !== false;
                    },
                ],
            ],
        ]);
    }

    /**
     * Handle the SEO audit request.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function handle(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        $url      = $request->get_param('url');
        $response = wp_remote_get($url, ['timeout' => 30, 'sslverify' => true]);

        if (is_wp_error($response)) {
            return new WP_Error('fetch_failed', 'Could not fetch the page: ' . $response->get_error_message(), ['status' => 502]);
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $html        = wp_remote_retrieve_body($response);

        $audit = [
            'url'              => $url,
            'status_code'      => $status_code,
            'title'            => $this->extract_tag($html, 'title'),
            'meta_description' => $this->extract_meta($html, 'description'),
            'meta_keywords'    => $this->extract_meta($html, 'keywords'),
            'headings'         => $this->extract_headings($html),
            'images_without_alt' => $this->count_images_without_alt($html),
            'canonical'        => $this->extract_link_rel($html, 'canonical'),
            'robots'           => $this->extract_meta($html, 'robots'),
            'og_title'         => $this->extract_meta_property($html, 'og:title'),
            'og_description'   => $this->extract_meta_property($html, 'og:description'),
            'audited_at'       => gmdate('Y-m-d\TH:i:s\Z'),
        ];

        return new WP_REST_Response($audit, 200);
    }

    /**
     * Extract content of an HTML tag.
     */
    private function extract_tag(string $html, string $tag): ?string {
        if (preg_match("/<{$tag}[^>]*>(.*?)<\/{$tag}>/is", $html, $m)) {
            return trim(wp_strip_all_tags($m[1]));
        }
        return null;
    }

    /**
     * Extract a meta tag content by name.
     */
    private function extract_meta(string $html, string $name): ?string {
        if (preg_match('/<meta\s[^>]*name=["\']' . preg_quote($name, '/') . '["\'][^>]*content=["\']([^"\']*)["\'][^>]*\/?>/is', $html, $m)) {
            return trim($m[1]);
        }
        // Also check reversed attribute order
        if (preg_match('/<meta\s[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']' . preg_quote($name, '/') . '["\'][^>]*\/?>/is', $html, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Extract a meta tag content by property (Open Graph).
     */
    private function extract_meta_property(string $html, string $property): ?string {
        if (preg_match('/<meta\s[^>]*property=["\']' . preg_quote($property, '/') . '["\'][^>]*content=["\']([^"\']*)["\'][^>]*\/?>/is', $html, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Extract link rel value (e.g., canonical).
     */
    private function extract_link_rel(string $html, string $rel): ?string {
        if (preg_match('/<link\s[^>]*rel=["\']' . preg_quote($rel, '/') . '["\'][^>]*href=["\']([^"\']*)["\'][^>]*\/?>/is', $html, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Extract heading structure (h1-h6 counts and content).
     */
    private function extract_headings(string $html): array {
        $headings = [];
        for ($i = 1; $i <= 6; $i++) {
            preg_match_all("/<h{$i}[^>]*>(.*?)<\/h{$i}>/is", $html, $matches);
            $headings["h{$i}"] = [
                'count'   => count($matches[1]),
                'content' => array_map(function ($h) {
                    return trim(wp_strip_all_tags($h));
                }, $matches[1]),
            ];
        }
        return $headings;
    }

    /**
     * Count images without alt attribute.
     */
    private function count_images_without_alt(string $html): int {
        preg_match_all('/<img\b[^>]*>/is', $html, $matches);
        $count = 0;
        foreach ($matches[0] as $img) {
            if (!preg_match('/\balt\s*=\s*["\'][^"\']+["\']/i', $img)) {
                $count++;
            }
        }
        return $count;
    }
}
