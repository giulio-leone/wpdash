<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Backup Status</h1>
    <div id="wpdash-sa-notice"></div>

    <div style="display:flex; gap:20px; margin-top:20px; flex-wrap:wrap;">

        <div class="wpdash-sa-card wpdash-backup-card" style="flex:1; min-width:280px;">
            <?php if ( $data['status'] === 'no_plugin' ) : ?>
                <div class="notice notice-warning" style="margin:0; padding:12px;">
                    <p><strong>⚠ No Backup Plugin Detected</strong></p>
                    <p>No supported backup plugin was found (UpdraftPlus, BackWPup, Duplicator). Install a backup plugin to protect your site.</p>
                    <a href="<?php echo esc_url( admin_url( 'plugin-install.php?s=updraftplus&tab=search&type=term' ) ); ?>" class="button button-primary">Browse Backup Plugins</a>
                </div>
            <?php else : ?>
                <div class="wpdash-backup-status">
                    <span class="dashicons dashicons-backup wpdash-backup-icon"></span>
                    <h3 style="margin:0;">Backup Information</h3>
                </div>
                <table class="widefat striped">
                    <tbody>
                        <tr>
                            <th style="width:140px">Plugin</th>
                            <td>
                                <span class="wpdash-sa-badge wpdash-sa-badge--active"><?php echo esc_html( $data['plugin'] ); ?></span>
                            </td>
                        </tr>
                        <tr>
                            <th>Last Backup</th>
                            <td>
                                <?php if ( $data['last_backup_at'] ) : ?>
                                    <?php echo esc_html( $data['last_backup_at'] ); ?>
                                    <br /><small style="color:#646970;"><?php echo esc_html( human_time_diff( strtotime( $data['last_backup_at'] ), time() ) ); ?> ago</small>
                                <?php else : ?>
                                    <span style="color:#999;">Unknown</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php if ( $data['size'] ) : ?>
                        <tr>
                            <th>Estimated Size</th>
                            <td><?php echo esc_html( $data['size'] ); ?></td>
                        </tr>
                        <?php endif; ?>
                        <tr>
                            <th>Status</th>
                            <td><span class="wpdash-sa-badge wpdash-sa-badge--active">OK</span></td>
                        </tr>
                    </tbody>
                </table>
            <?php endif; ?>

            <p style="margin-top:16px;">
                <button class="button button-primary" id="wpdash-refresh-backup">Check Status</button>
            </p>
        </div>

        <div class="wpdash-sa-card" style="flex:1; min-width:280px;">
            <h3 style="margin-top:0;">Backup Tips</h3>
            <ul style="list-style:disc; padding-left:20px; line-height:1.8;">
                <li>Schedule automatic backups at least weekly</li>
                <li>Store backups off-site (cloud storage)</li>
                <li>Test restore procedures periodically</li>
                <li>Back up both files and database</li>
                <li>Keep at least 3 backup copies</li>
            </ul>
        </div>
    </div>
</div>
