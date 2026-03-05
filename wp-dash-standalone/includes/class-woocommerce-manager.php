<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_WooCommerce_Manager {

    public function is_active(): bool {
        return class_exists( 'WooCommerce' );
    }

    public function get_stats(): ?array {
        if ( ! $this->is_active() ) {
            return null;
        }

        return [
            'revenue'       => $this->get_revenue(),
            'orders'        => $this->get_order_counts(),
            'recent_orders' => $this->get_recent_orders(),
            'low_stock'     => $this->get_low_stock(),
            'total_products'=> $this->get_total_products(),
        ];
    }

    private function get_revenue(): array {
        global $wpdb;

        $today_start = date( 'Y-m-d 00:00:00' );
        $month_start = date( 'Y-m-01 00:00:00' );

        $completed_statuses = "'wc-completed', 'wc-processing'";

        $today_revenue = (float) $wpdb->get_var( $wpdb->prepare(
            "SELECT SUM(meta_value) FROM {$wpdb->postmeta}
             INNER JOIN {$wpdb->posts} ON {$wpdb->posts}.ID = {$wpdb->postmeta}.post_id
             WHERE meta_key = '_order_total'
               AND post_status IN ({$completed_statuses})
               AND post_type = 'shop_order'
               AND post_date >= %s",
            $today_start
        ) );

        $month_revenue = (float) $wpdb->get_var( $wpdb->prepare(
            "SELECT SUM(meta_value) FROM {$wpdb->postmeta}
             INNER JOIN {$wpdb->posts} ON {$wpdb->posts}.ID = {$wpdb->postmeta}.post_id
             WHERE meta_key = '_order_total'
               AND post_status IN ({$completed_statuses})
               AND post_type = 'shop_order'
               AND post_date >= %s",
            $month_start
        ) );

        $currency = get_woocommerce_currency_symbol();

        return [
            'today'    => $currency . number_format( $today_revenue, 2 ),
            'month'    => $currency . number_format( $month_revenue, 2 ),
            'currency' => $currency,
        ];
    }

    private function get_order_counts(): array {
        $statuses = [ 'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed' ];
        $counts   = [];

        foreach ( $statuses as $status ) {
            $orders          = wc_get_orders( [
                'status' => $status,
                'limit'  => -1,
                'return' => 'ids',
            ] );
            $counts[$status] = count( $orders );
        }

        return $counts;
    }

    private function get_recent_orders( int $limit = 10 ): array {
        $orders = wc_get_orders( [
            'limit'   => $limit,
            'orderby' => 'date',
            'order'   => 'DESC',
        ] );

        $result = [];
        foreach ( $orders as $order ) {
            $result[] = [
                'id'       => $order->get_id(),
                'customer' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'email'    => $order->get_billing_email(),
                'total'    => $order->get_formatted_order_total(),
                'status'   => $order->get_status(),
                'date'     => $order->get_date_created() ? $order->get_date_created()->date( 'Y-m-d H:i' ) : '—',
            ];
        }

        return $result;
    }

    private function get_low_stock( int $threshold = 5 ): array {
        $args = [
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'meta_query'     => [
                [
                    'key'     => '_stock',
                    'value'   => $threshold,
                    'compare' => '<=',
                    'type'    => 'NUMERIC',
                ],
                [
                    'key'   => '_manage_stock',
                    'value' => 'yes',
                ],
            ],
        ];

        $query  = new WP_Query( $args );
        $result = [];

        foreach ( $query->posts as $post ) {
            $product  = wc_get_product( $post->ID );
            $result[] = [
                'id'    => $post->ID,
                'name'  => $post->post_title,
                'stock' => $product ? $product->get_stock_quantity() : 0,
            ];
        }

        wp_reset_postdata();

        return $result;
    }

    private function get_total_products(): int {
        $count = wp_count_posts( 'product' );
        return (int) ( $count->publish ?? 0 );
    }
}
