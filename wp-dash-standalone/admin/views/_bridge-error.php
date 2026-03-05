<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — <?php echo esc_html( ucfirst( $view ) ); ?></h1>
    <div class="notice notice-error" style="margin-top:20px;">
        <p><strong>Bridge Connection Error</strong></p>
        <p><?php echo esc_html( $error_msg ); ?></p>
        <p>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-settings' ) ); ?>" class="button">Check Site Settings</a>
            <a href="<?php echo esc_url( add_query_arg( [] ) ); ?>" class="button" style="margin-left:8px;">Retry</a>
        </p>
    </div>
</div>
