<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — PHP Logs</h1>
    <div id="wpdash-sa-notice"></div>

    <?php if ( ! $data['success'] ) : ?>
        <div class="notice notice-warning"><p><?php echo esc_html( $data['message'] ); ?></p></div>
    <?php endif; ?>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <nav class="nav-tab-wrapper wpdash-log-tabs">
            <a href="#" class="nav-tab nav-tab-active" data-level="all">All</a>
            <a href="#" class="nav-tab" data-level="fatal">Fatal</a>
            <a href="#" class="nav-tab" data-level="error">Error</a>
            <a href="#" class="nav-tab" data-level="warning">Warning</a>
            <a href="#" class="nav-tab" data-level="notice">Notice</a>
        </nav>
        <div style="display:flex; gap:8px;">
            <button class="button" id="wpdash-refresh-logs">Refresh</button>
            <button class="button" id="wpdash-clear-logs" style="color:#a00;">Clear Log</button>
        </div>
    </div>

    <?php if ( $data['success'] ) : ?>
        <p style="color:#646970; font-size:12px;">Log file: <code><?php echo esc_html( $data['log_path'] ); ?></code></p>
    <?php endif; ?>

    <table class="wp-list-table widefat fixed striped" id="wpdash-logs-table">
        <thead>
            <tr>
                <th style="width:20%">Timestamp</th>
                <th style="width:10%">Level</th>
                <th>Message</th>
            </tr>
        </thead>
        <tbody>
        <?php if ( ! empty( $data['entries'] ) ) : ?>
            <?php foreach ( $data['entries'] as $entry ) : ?>
                <tr data-level="<?php echo esc_attr( $entry['level'] ); ?>">
                    <td style="font-size:12px;"><?php echo esc_html( $entry['timestamp'] ); ?></td>
                    <td>
                        <span class="wpdash-log-badge wpdash-log-badge--<?php echo esc_attr( strtolower( $entry['level'] ) ); ?>"><?php echo esc_html( strtoupper( $entry['level'] ) ); ?></span>
                    </td>
                    <td style="font-size:12px; word-break:break-all;"><?php echo esc_html( $entry['message'] ); ?></td>
                </tr>
            <?php endforeach; ?>
        <?php else : ?>
            <tr><td colspan="3" style="text-align:center; color:#999;">No log entries found.</td></tr>
        <?php endif; ?>
        </tbody>
    </table>
</div>
