<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Security</h1>
    <div id="wpdash-sa-notice"></div>

    <div class="wpdash-sa-card" style="max-width:700px;">
        <p>Run a core file integrity check against WordPress.org checksums. Modified or missing files will be listed below.</p>
        <button class="button button-primary" id="wpdash-run-security-check">
            Run Integrity Check
        </button>
        <span class="wpdash-sa-spinner" id="wpdash-security-spinner" style="display:none;"></span>
        <span id="wpdash-security-progress" style="display:none; margin-left:12px; color:#646970;">Checking… this may take a few seconds.</span>
    </div>

    <div id="wpdash-security-results" style="margin-top:20px;"></div>
</div>

<script>
// Inline template for results (populated via JS)
window.wpdashSecurityTemplate = function(data) {
    if (!data.success) {
        return '<div class="notice notice-error"><p>' + data.message + '</p></div>';
    }
    var html = '<div class="wpdash-sa-card" style="max-width:700px;">';
    html += '<h3 style="margin-top:0;">Result for WordPress ' + data.wp_version + '</h3>';
    html += '<p>Checked <strong>' + data.checked_files + '</strong> files. ';
    if (data.clean) {
        html += '<span class="wpdash-sa-badge wpdash-sa-badge--active" style="font-size:14px;">✓ Clean — No Issues Found</span>';
    } else {
        html += '<span class="wpdash-sa-badge wpdash-sa-badge--inactive" style="font-size:14px;">⚠ Issues Found: ' + data.modified.length + ' file(s)</span>';
    }
    html += '</p>';
    if (!data.clean) {
        html += '<table class="wp-list-table widefat fixed striped"><thead><tr><th>File</th><th>Status</th></tr></thead><tbody>';
        data.modified.forEach(function(f) {
            html += '<tr><td><code>' + f.file + '</code></td><td><span class="wpdash-sa-badge wpdash-sa-badge--inactive">' + f.status + '</span></td></tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';
    return html;
};
</script>
