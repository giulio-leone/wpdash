<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — WooCommerce</h1>
    <div id="wpdash-sa-notice"></div>

    <?php if ( ! $data ) : ?>
        <div class="notice notice-warning">
            <p><strong>WooCommerce is not active.</strong></p>
            <p>Install and activate WooCommerce to see revenue stats, orders, and product data here.</p>
            <a href="<?php echo esc_url( admin_url( 'plugin-install.php?s=woocommerce&tab=search&type=term' ) ); ?>" class="button button-primary">Install WooCommerce</a>
        </div>
    <?php else : ?>

    <!-- Revenue cards -->
    <div class="wpdash-woo-stats">
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['revenue']['today'] ); ?></div>
            <div class="wpdash-sa-card__label">Revenue Today</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['revenue']['month'] ); ?></div>
            <div class="wpdash-sa-card__label">Revenue This Month</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['orders']['processing'] ?? 0 ); ?></div>
            <div class="wpdash-sa-card__label">Processing Orders</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['total_products'] ); ?></div>
            <div class="wpdash-sa-card__label">Total Products</div>
        </div>
    </div>

    <!-- Order status counts -->
    <div class="wpdash-sa-card" style="margin-bottom:20px;">
        <h3 style="margin-top:0;">Order Status Breakdown</h3>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <?php foreach ( $data['orders'] as $status => $count ) : ?>
                <div style="text-align:center; padding:12px 20px; background:#f6f7f7; border-radius:4px;">
                    <div style="font-size:1.6em; font-weight:700;"><?php echo esc_html( $count ); ?></div>
                    <div style="font-size:12px; color:#646970;"><?php echo esc_html( ucfirst( $status ) ); ?></div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Recent orders -->
    <h2>Recent Orders</h2>
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th style="width:8%">ID</th>
                <th style="width:25%">Customer</th>
                <th style="width:20%">Email</th>
                <th style="width:12%">Total</th>
                <th style="width:12%">Status</th>
                <th style="width:15%">Date</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $data['recent_orders'] as $order ) : ?>
            <tr>
                <td><a href="<?php echo esc_url( admin_url( 'post.php?post=' . $order['id'] . '&action=edit' ) ); ?>" target="_blank">#<?php echo esc_html( $order['id'] ); ?></a></td>
                <td><?php echo esc_html( $order['customer'] ); ?></td>
                <td><?php echo esc_html( $order['email'] ); ?></td>
                <td><?php echo wp_kses_post( $order['total'] ); ?></td>
                <td><span class="wpdash-sa-badge wpdash-sa-badge--update"><?php echo esc_html( $order['status'] ); ?></span></td>
                <td><?php echo esc_html( $order['date'] ); ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if ( empty( $data['recent_orders'] ) ) : ?>
            <tr><td colspan="6" style="text-align:center; color:#999;">No orders found.</td></tr>
        <?php endif; ?>
        </tbody>
    </table>

    <!-- Low stock -->
    <?php if ( ! empty( $data['low_stock'] ) ) : ?>
    <h2>⚠ Low Stock Alert</h2>
    <table class="wp-list-table widefat fixed striped" style="max-width:500px;">
        <thead>
            <tr><th>Product</th><th>Stock</th></tr>
        </thead>
        <tbody>
        <?php foreach ( $data['low_stock'] as $product ) : ?>
            <tr>
                <td><a href="<?php echo esc_url( admin_url( 'post.php?post=' . $product['id'] . '&action=edit' ) ); ?>" target="_blank"><?php echo esc_html( $product['name'] ); ?></a></td>
                <td><span class="wpdash-sa-badge wpdash-sa-badge--inactive"><?php echo esc_html( $product['stock'] ); ?></span></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>

    <?php endif; ?>
</div>
