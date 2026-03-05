<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Settings</h1>
    <div id="wpdash-sa-notice"></div>

    <h2 style="margin-top:24px;">Connected Sites</h2>

    <?php if ( empty( $sites ) ) : ?>
        <p style="color:#646970;">No sites configured yet. Add your first site below.</p>
    <?php else : ?>
        <table class="wp-list-table widefat fixed striped" style="max-width:900px;" id="wpdash-sites-table">
            <thead>
                <tr>
                    <th style="width:22%">Name</th>
                    <th style="width:38%">URL</th>
                    <th style="width:15%">Status</th>
                    <th style="width:25%">Actions</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ( $sites as $id => $site ) : ?>
                <tr data-site-id="<?php echo esc_attr( $id ); ?>">
                    <td>
                        <strong><?php echo esc_html( $site['name'] ); ?></strong>
                        <?php if ( $active_id === $id ) : ?>
                            <span class="wpdash-sa-badge wpdash-sa-badge--active" style="margin-left:6px; vertical-align:middle;">Active</span>
                        <?php endif; ?>
                    </td>
                    <td style="word-break:break-all;"><?php echo esc_html( $site['url'] ); ?></td>
                    <td>
                        <span class="wpdash-site-status" data-site-id="<?php echo esc_attr( $id ); ?>" style="color:#646970; font-size:12px;">—</span>
                    </td>
                    <td style="white-space:nowrap;">
                        <?php if ( $active_id !== $id ) : ?>
                            <button class="button button-small button-primary wpdash-site-switch" data-site-id="<?php echo esc_attr( $id ); ?>">Switch To</button>
                        <?php else : ?>
                            <em style="font-size:12px; color:#646970;">Active</em>
                        <?php endif; ?>
                        <button class="button button-small wpdash-site-test" data-site-id="<?php echo esc_attr( $id ); ?>" style="margin-left:4px;">Ping</button>
                        <button class="button button-small wpdash-site-remove wpdash-btn-danger" data-site-id="<?php echo esc_attr( $id ); ?>" data-name="<?php echo esc_attr( $site['name'] ); ?>" style="margin-left:4px;">Remove</button>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>

    <hr style="margin:32px 0;" />

    <div class="wpdash-sa-card" style="max-width:620px;">
        <h2 style="margin-top:0;">Add New Site</h2>
        <p style="color:#646970; margin-bottom:16px;">
            Enter the URL and Bearer token for a remote WordPress site running <strong>wp-dash-bridge</strong>.
        </p>
        <table class="form-table" style="margin:0;">
            <tr>
                <th style="width:120px;"><label for="wpdash-site-name">Name</label></th>
                <td><input type="text" id="wpdash-site-name" class="regular-text" placeholder="My Production Site" /></td>
            </tr>
            <tr>
                <th><label for="wpdash-site-url">Site URL</label></th>
                <td><input type="url" id="wpdash-site-url" class="regular-text" placeholder="https://example.com" /></td>
            </tr>
            <tr>
                <th><label for="wpdash-site-token">Bearer Token</label></th>
                <td>
                    <input type="text" id="wpdash-site-token" class="regular-text" placeholder="Token from wp-dash-bridge settings" style="width:100%;" />
                    <div style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                        <button class="button button-secondary" id="wpdash-test-connection">Test Connection</button>
                        <span id="wpdash-test-result" style="font-size:13px;"></span>
                    </div>
                </td>
            </tr>
        </table>
        <p style="margin-top:20px;">
            <button class="button button-primary" id="wpdash-add-site-btn">Add Site</button>
        </p>
    </div>
</div>
