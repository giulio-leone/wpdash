<?php
/**
 * Admin settings page template for WP Dash Bridge.
 *
 * @var bool   $is_configured Whether a token hash is stored.
 * @var string|false $initial_token The plaintext token (only available briefly after generation).
 */

if (!defined('ABSPATH')) exit;
?>
<div class="wrap">
    <h1><?php esc_html_e('WP Dash Bridge', 'wp-dash-bridge'); ?></h1>

    <?php settings_errors('wpdash_bridge'); ?>

    <div class="card" style="max-width: 600px;">
        <h2><?php esc_html_e('Connection Status', 'wp-dash-bridge'); ?></h2>

        <table class="form-table" role="presentation">
            <tr>
                <th scope="row"><?php esc_html_e('Status', 'wp-dash-bridge'); ?></th>
                <td>
                    <?php if ($is_configured): ?>
                        <span style="color: #00a32a;">&#9679;</span>
                        <?php esc_html_e('Configured — API access enabled', 'wp-dash-bridge'); ?>
                    <?php else: ?>
                        <span style="color: #d63638;">&#9679;</span>
                        <?php esc_html_e('Not configured — API access disabled', 'wp-dash-bridge'); ?>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php esc_html_e('Plugin Version', 'wp-dash-bridge'); ?></th>
                <td><?php echo esc_html(WPDASH_BRIDGE_VERSION); ?></td>
            </tr>
            <tr>
                <th scope="row"><?php esc_html_e('API Base URL', 'wp-dash-bridge'); ?></th>
                <td><code><?php echo esc_url(rest_url('wpdash/v1/')); ?></code></td>
            </tr>
        </table>
    </div>

    <?php if ($initial_token): ?>
    <div class="notice notice-info" style="max-width: 600px; padding: 12px;">
        <p><strong><?php esc_html_e('Your API Token (copy now — it will disappear in 5 minutes):', 'wp-dash-bridge'); ?></strong></p>
        <p>
            <input type="text" id="wpdash-token" value="<?php echo esc_attr($initial_token); ?>"
                   readonly="readonly" class="large-text code" style="background: #f0f0f1;"
                   onclick="this.select();" />
        </p>
        <p>
            <button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('wpdash-token').value).then(function(){alert('Token copied!')});">
                <?php esc_html_e('Copy to Clipboard', 'wp-dash-bridge'); ?>
            </button>
        </p>
    </div>
    <?php endif; ?>

    <div class="card" style="max-width: 600px;">
        <h2><?php esc_html_e('Token Management', 'wp-dash-bridge'); ?></h2>

        <form method="post">
            <?php wp_nonce_field('wpdash_bridge_actions'); ?>

            <p>
                <button type="submit" name="wpdash_regenerate_token" class="button button-primary"
                        onclick="return confirm('<?php esc_attr_e('Regenerate the token? The current token will be invalidated.', 'wp-dash-bridge'); ?>');">
                    <?php esc_html_e('Regenerate Token', 'wp-dash-bridge'); ?>
                </button>
            </p>

            <?php if ($is_configured): ?>
            <p>
                <button type="submit" name="wpdash_revoke_token" class="button button-link-delete"
                        onclick="return confirm('<?php esc_attr_e('Revoke the token? API access will be disabled until a new token is generated.', 'wp-dash-bridge'); ?>');">
                    <?php esc_html_e('Revoke Token', 'wp-dash-bridge'); ?>
                </button>
            </p>
            <?php endif; ?>
        </form>
    </div>

    <div class="card" style="max-width: 600px;">
        <h2><?php esc_html_e('Available Endpoints', 'wp-dash-bridge'); ?></h2>
        <table class="widefat striped">
            <thead>
                <tr>
                    <th><?php esc_html_e('Method', 'wp-dash-bridge'); ?></th>
                    <th><?php esc_html_e('Endpoint', 'wp-dash-bridge'); ?></th>
                    <th><?php esc_html_e('Description', 'wp-dash-bridge'); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr><td>GET</td><td><code>/wpdash/v1/health</code></td><td><?php esc_html_e('Site health overview', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>GET</td><td><code>/wpdash/v1/plugins</code></td><td><?php esc_html_e('List all plugins', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>POST</td><td><code>/wpdash/v1/plugins/manage</code></td><td><?php esc_html_e('Activate/deactivate/update/delete plugin', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>POST</td><td><code>/wpdash/v1/plugins/install</code></td><td><?php esc_html_e('Install plugin from URL or slug', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>GET</td><td><code>/wpdash/v1/security/integrity</code></td><td><?php esc_html_e('Core file integrity check', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>POST</td><td><code>/wpdash/v1/seo/audit</code></td><td><?php esc_html_e('SEO page audit', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>GET</td><td><code>/wpdash/v1/logs</code></td><td><?php esc_html_e('PHP error logs', 'wp-dash-bridge'); ?></td></tr>
                <tr><td>GET</td><td><code>/wpdash/v1/backup/status</code></td><td><?php esc_html_e('Backup status', 'wp-dash-bridge'); ?></td></tr>
            </tbody>
        </table>
    </div>

    <div class="card" style="max-width: 600px;">
        <h2><?php esc_html_e('Rate Limiting', 'wp-dash-bridge'); ?></h2>
        <p><?php esc_html_e('Rate limiting: 60 requests per minute per IP address.', 'wp-dash-bridge'); ?></p>
    </div>
</div>
