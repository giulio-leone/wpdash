<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash</h1>
    <div id="wpdash-sa-notice"></div>

    <div style="display:flex; justify-content:center; margin-top:40px;">
        <div class="wpdash-sa-card" style="max-width:580px; text-align:center; padding:40px 40px 32px;">
            <span class="dashicons dashicons-admin-network" style="font-size:56px; width:56px; height:56px; color:#c3c4c7; display:block; margin:0 auto 12px;"></span>
            <h2 style="margin:0 0 8px;">No Sites Connected</h2>
            <p style="color:#646970; font-size:14px; margin:0 0 28px;">Connect a remote WordPress site running <strong>wp-dash-bridge</strong> to get started.</p>

            <div style="text-align:left;">
                <table class="form-table" style="margin:0;">
                    <tr>
                        <th style="width:100px;"><label for="wpdash-site-name">Name</label></th>
                        <td><input type="text" id="wpdash-site-name" class="regular-text" placeholder="My Production Site" /></td>
                    </tr>
                    <tr>
                        <th><label for="wpdash-site-url">Site URL</label></th>
                        <td><input type="url" id="wpdash-site-url" class="regular-text" placeholder="https://example.com" /></td>
                    </tr>
                    <tr>
                        <th><label for="wpdash-site-token">Token</label></th>
                        <td>
                            <input type="text" id="wpdash-site-token" class="regular-text" placeholder="Bearer token from wp-dash-bridge" style="width:100%;" />
                            <div style="margin-top:6px;">
                                <button class="button button-secondary" id="wpdash-test-connection">Test Connection</button>
                                <span id="wpdash-test-result" style="margin-left:8px; font-size:13px;"></span>
                            </div>
                        </td>
                    </tr>
                </table>
                <p style="text-align:center; margin-top:20px;">
                    <button class="button button-primary button-large" id="wpdash-add-site-btn">Connect Site</button>
                </p>
            </div>
        </div>
    </div>
</div>
