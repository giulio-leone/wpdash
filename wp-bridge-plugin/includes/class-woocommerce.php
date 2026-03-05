<?php
/**
 * WooCommerce endpoint for WP Dash Bridge.
 *
 * Uses native WooCommerce PHP functions — no consumer keys required.
 * All endpoints return 404 if WooCommerce is not active.
 */

if (!defined('ABSPATH')) exit;

class WPDash_WooCommerce {

    /** @var WPDash_Auth */
    private $auth;

    /** @var WPDash_Rate_Limiter */
    private $rate_limiter;

    public function __construct(WPDash_Auth $auth, WPDash_Rate_Limiter $rate_limiter) {
        $this->auth         = $auth;
        $this->rate_limiter = $rate_limiter;
    }

    private function wc_active(): bool {
        return class_exists('WooCommerce');
    }

    private function wc_inactive_error(): WP_Error {
        return new WP_Error('woocommerce_inactive', 'WooCommerce is not active on this site', ['status' => 404]);
    }

    public function register_routes(): void {
        register_rest_route('wpdash/v1', '/woocommerce/stats', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_stats'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/woocommerce/orders', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_orders'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/woocommerce/orders/manage', [
            'methods'             => 'POST',
            'callback'            => [$this, 'manage_order'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/woocommerce/products', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_products'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
        register_rest_route('wpdash/v1', '/woocommerce/customers', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_customers'],
            'permission_callback' => [$this->auth, 'check_permission'],
        ]);
    }

    public function get_stats(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;
        if (!$this->wc_active()) return $this->wc_inactive_error();

        global $wpdb;

        $today_start = gmdate('Y-m-d 00:00:00');
        $month_start = gmdate('Y-m-01 00:00:00');

        // Revenue today (completed + processing)
        $revenue_today = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(pm.meta_value), 0)
             FROM {$wpdb->postmeta} pm
             INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
             WHERE pm.meta_key = '_order_total'
               AND p.post_type = 'shop_order'
               AND p.post_status IN ('wc-completed','wc-processing')
               AND p.post_date_gmt >= %s",
            $today_start
        ));

        // Revenue this month
        $revenue_month = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(pm.meta_value), 0)
             FROM {$wpdb->postmeta} pm
             INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
             WHERE pm.meta_key = '_order_total'
               AND p.post_type = 'shop_order'
               AND p.post_status IN ('wc-completed','wc-processing')
               AND p.post_date_gmt >= %s",
            $month_start
        ));

        // Order counts by status
        $status_counts = $wpdb->get_results(
            "SELECT post_status, COUNT(*) AS cnt
             FROM {$wpdb->posts}
             WHERE post_type = 'shop_order'
             GROUP BY post_status"
        );
        $counts = [];
        foreach ($status_counts as $row) {
            $counts[$row->post_status] = intval($row->cnt);
        }

        // Total customers
        $total_customers = count(get_users(['role' => 'customer', 'fields' => 'ID']));

        // Total products
        $products_count = wp_count_posts('product');
        $total_products = intval($products_count->publish ?? 0);

        // Low stock (stock between 1 and 4)
        $low_stock_count = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT p.ID)
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_stock'
             WHERE p.post_type = 'product'
               AND p.post_status = 'publish'
               AND CAST(pm.meta_value AS SIGNED) BETWEEN 1 AND 4"
        );

        // Out of stock
        $out_of_stock_count = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT p.ID)
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_stock_status'
             WHERE p.post_type = 'product'
               AND p.post_status = 'publish'
               AND pm.meta_value = 'outofstock'"
        );

        return new WP_REST_Response([
            'is_active'          => true,
            'currency'           => function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'USD',
            'currency_symbol'    => function_exists('get_woocommerce_currency_symbol') ? get_woocommerce_currency_symbol() : '$',
            'revenue_today'      => round($revenue_today, 2),
            'revenue_month'      => round($revenue_month, 2),
            'orders_pending'     => $counts['wc-pending'] ?? 0,
            'orders_processing'  => $counts['wc-processing'] ?? 0,
            'orders_completed'   => $counts['wc-completed'] ?? 0,
            'orders_cancelled'   => $counts['wc-cancelled'] ?? 0,
            'orders_on_hold'     => $counts['wc-on-hold'] ?? 0,
            'total_customers'    => $total_customers,
            'total_products'     => $total_products,
            'low_stock_count'    => $low_stock_count,
            'out_of_stock_count' => $out_of_stock_count,
            'checked_at'         => gmdate('Y-m-d\TH:i:s\Z'),
        ], 200);
    }

    public function get_orders(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;
        if (!$this->wc_active()) return $this->wc_inactive_error();

        $limit = min(intval($request->get_param('limit') ?? 20), 50);

        $orders = wc_get_orders([
            'limit'   => $limit,
            'orderby' => 'date',
            'order'   => 'DESC',
            'type'    => 'shop_order',
        ]);

        $result = [];
        foreach ($orders as $order) {
            $created = $order->get_date_created();
            $result[] = [
                'id'             => $order->get_id(),
                'number'         => $order->get_order_number(),
                'status'         => $order->get_status(),
                'total'          => (float) $order->get_total(),
                'currency'       => $order->get_currency(),
                'customer_name'  => trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()) ?: 'Guest',
                'customer_email' => $order->get_billing_email(),
                'items_count'    => $order->get_item_count(),
                'date'           => $created ? $created->format('c') : null,
                'payment_method' => $order->get_payment_method_title(),
            ];
        }

        return new WP_REST_Response($result, 200);
    }

    public function manage_order(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;
        if (!$this->wc_active()) return $this->wc_inactive_error();

        $order_id = intval($request->get_param('order_id') ?? 0);
        $status   = sanitize_text_field($request->get_param('status') ?? '');

        $valid = ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'];
        if (!in_array($status, $valid, true)) {
            return new WP_Error('invalid_status', 'Invalid order status. Valid: ' . implode(', ', $valid), ['status' => 400]);
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', 'Order not found', ['status' => 404]);
        }

        $order->update_status($status, 'Status updated via WP Dash');

        return new WP_REST_Response([
            'message'  => 'Order status updated',
            'order_id' => $order_id,
            'status'   => $status,
        ], 200);
    }

    public function get_products(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;
        if (!$this->wc_active()) return $this->wc_inactive_error();

        $limit = min(intval($request->get_param('limit') ?? 30), 100);

        $products = wc_get_products([
            'limit'   => $limit,
            'orderby' => 'date',
            'order'   => 'DESC',
            'status'  => 'publish',
        ]);

        $result = [];
        foreach ($products as $product) {
            $result[] = [
                'id'             => $product->get_id(),
                'name'           => $product->get_name(),
                'sku'            => $product->get_sku(),
                'type'           => $product->get_type(),
                'price'          => (float) $product->get_price(),
                'regular_price'  => (float) $product->get_regular_price(),
                'sale_price'     => $product->is_on_sale() ? (float) $product->get_sale_price() : null,
                'is_on_sale'     => $product->is_on_sale(),
                'stock_status'   => $product->get_stock_status(),
                'stock_quantity' => $product->get_stock_quantity(),
                'manage_stock'   => $product->managing_stock(),
                'status'         => $product->get_status(),
                'total_sales'    => intval($product->get_total_sales()),
                'image_url'      => wp_get_attachment_url($product->get_image_id()) ?: null,
            ];
        }

        return new WP_REST_Response($result, 200);
    }

    public function get_customers(WP_REST_Request $request) {
        $rate_check = $this->rate_limiter->check();
        if (is_wp_error($rate_check)) return $rate_check;
        if (!$this->wc_active()) return $this->wc_inactive_error();

        $limit = min(intval($request->get_param('limit') ?? 20), 50);

        $users = get_users([
            'role'    => 'customer',
            'orderby' => 'registered',
            'order'   => 'DESC',
            'number'  => $limit,
        ]);

        $result = [];
        foreach ($users as $user) {
            $customer = new WC_Customer($user->ID);
            $result[] = [
                'id'            => $user->ID,
                'display_name'  => $user->display_name,
                'email'         => $user->user_email,
                'registered_at' => $user->user_registered,
                'orders_count'  => $customer->get_order_count(),
                'total_spent'   => (float) $customer->get_total_spent(),
                'avatar_url'    => get_avatar_url($user->ID, ['size' => 48]),
                'city'          => $customer->get_billing_city(),
                'country'       => $customer->get_billing_country(),
            ];
        }

        return new WP_REST_Response($result, 200);
    }
}
