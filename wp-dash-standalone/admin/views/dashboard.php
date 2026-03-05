<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Overview</h1>

    <div class="wpdash-sa-cards" id="wpdash-health-cards">
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['wp_version'] ); ?></div>
            <div class="wpdash-sa-card__label">WordPress Version</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['php_version'] ); ?></div>
            <div class="wpdash-sa-card__label">PHP Version</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['db_latency_ms'] ); ?> ms</div>
            <div class="wpdash-sa-card__label">DB Latency</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value <?php echo $data['health_score'] >= 80 ? 'wpdash-score--good' : ($data['health_score'] >= 60 ? 'wpdash-score--warn' : 'wpdash-score--bad'); ?>">
                <?php echo esc_html( $data['health_score'] ); ?>/100
            </div>
            <div class="wpdash-sa-card__label">Health Score</div>
        </div>
    </div>

    <div class="wpdash-sa-cards" style="grid-template-columns: repeat(3, 1fr);">
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['active_plugins_count'] ); ?></div>
            <div class="wpdash-sa-card__label">Active Plugins</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value" style="font-size:1.2em;"><?php echo esc_html( $data['active_theme'] ); ?></div>
            <div class="wpdash-sa-card__label">Active Theme</div>
        </div>
        <div class="wpdash-sa-card">
            <div class="wpdash-sa-card__value"><?php echo esc_html( $data['memory_limit'] ); ?></div>
            <div class="wpdash-sa-card__label">Memory Limit</div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(2,1fr); gap:16px; margin:20px 0;">
        <div class="wpdash-sa-card">
            <table class="widefat striped" style="margin:0;">
                <tbody>
                    <tr><th>Site URL</th><td><?php echo esc_html( $data['site_url'] ); ?></td></tr>
                    <tr><th>Admin Email</th><td><?php echo esc_html( $data['admin_email'] ); ?></td></tr>
                    <tr><th>Language</th><td><?php echo esc_html( $data['language'] ); ?></td></tr>
                    <tr><th>Timezone</th><td><?php echo esc_html( $data['timezone'] ); ?></td></tr>
                    <tr><th>DB Version</th><td><?php echo esc_html( $data['db_version'] ); ?></td></tr>
                    <tr><th>Upload Max</th><td><?php echo esc_html( $data['upload_max_filesize'] ); ?></td></tr>
                </tbody>
            </table>
        </div>
        <div class="wpdash-sa-card">
            <h3 style="margin-top:0;">Quick Links</h3>
            <ul style="list-style:disc; padding-left:20px; line-height:2;">
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-plugins' ) ); ?>">Manage Plugins</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-themes' ) ); ?>">Manage Themes</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-users' ) ); ?>">Manage Users</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-content' ) ); ?>">Manage Content</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-database' ) ); ?>">Database Tools</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-security' ) ); ?>">Security Audit</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-seo' ) ); ?>">SEO Audit</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-logs' ) ); ?>">PHP Error Logs</a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-backup' ) ); ?>">Backup Status</a></li>
                <?php if ( class_exists( 'WooCommerce' ) ) : ?>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-woocommerce' ) ); ?>">WooCommerce Hub</a></li>
                <?php endif; ?>
            </ul>
        </div>
    </div>

    <div id="wpdash-sa-notice"></div>
</div>
