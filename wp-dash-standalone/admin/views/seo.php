<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — SEO Audit</h1>
    <div id="wpdash-sa-notice"></div>

    <div class="wpdash-sa-card" style="max-width:700px; margin-bottom:20px;">
        <label for="wpdash-seo-url" style="font-weight:600; display:block; margin-bottom:8px;">URL to audit:</label>
        <div style="display:flex; gap:8px;">
            <input type="url" id="wpdash-seo-url" class="regular-text" placeholder="<?php echo esc_attr( $active_site['url'] ?? get_site_url() ); ?>" value="<?php echo esc_attr( $active_site['url'] ?? get_site_url() ); ?>" style="flex:1;" />
            <button class="button button-primary" id="wpdash-run-seo">Run Audit</button>
            <span class="wpdash-sa-spinner" id="wpdash-seo-spinner" style="display:none;"></span>
        </div>
    </div>

    <div id="wpdash-seo-results" style="max-width:700px;"></div>
</div>

<script>
window.wpdashSeoTemplate = function(data) {
    if (!data.success) {
        return '<div class="notice notice-error"><p>' + data.message + '</p></div>';
    }

    function lengthBadge(len, min, max) {
        if (len >= min && len <= max) return '<span class="wpdash-sa-badge wpdash-sa-badge--active">' + len + ' chars ✓</span>';
        if (len === 0) return '<span class="wpdash-sa-badge wpdash-sa-badge--inactive">Missing</span>';
        return '<span class="wpdash-sa-badge wpdash-sa-badge--update">' + len + ' chars (ideal: ' + min + '–' + max + ')</span>';
    }

    var h = '<div class="wpdash-sa-card">';
    h += '<h3 style="margin-top:0;">SEO Results: <a href="' + data.url + '" target="_blank">' + data.url + '</a></h3>';
    h += '<table class="widefat striped"><tbody>';
    h += '<tr><th style="width:180px">Title</th><td>' + (data.title || '<em>missing</em>') + '</td><td>' + lengthBadge(data.title_length, 50, 60) + '</td></tr>';
    h += '<tr><th>Meta Description</th><td>' + (data.meta_description || '<em>missing</em>') + '</td><td>' + lengthBadge(data.meta_desc_length, 150, 160) + '</td></tr>';
    h += '<tr><th>OG Title</th><td colspan="2">' + (data.og_title || '<em>missing</em>') + '</td></tr>';
    h += '<tr><th>OG Description</th><td colspan="2">' + (data.og_description || '<em>missing</em>') + '</td></tr>';
    h += '<tr><th>Canonical</th><td colspan="2">' + (data.canonical || '<em>missing</em>') + '</td></tr>';

    var h1Count = data.headings.h1 ? data.headings.h1.count : 0;
    var h1Badge = h1Count === 1
        ? '<span class="wpdash-sa-badge wpdash-sa-badge--active">1 ✓</span>'
        : '<span class="wpdash-sa-badge wpdash-sa-badge--inactive">' + h1Count + ' (should be 1)</span>';
    h += '<tr><th>H1</th><td>' + (data.headings.h1 && data.headings.h1.texts[0] ? data.headings.h1.texts[0] : '—') + '</td><td>' + h1Badge + '</td></tr>';

    ['h2','h3','h4','h5','h6'].forEach(function(tag) {
        var count = data.headings[tag] ? data.headings[tag].count : 0;
        if (count > 0) {
            h += '<tr><th>' + tag.toUpperCase() + '</th><td>' + data.headings[tag].texts.slice(0,3).join(', ') + (count > 3 ? '…' : '') + '</td><td>' + count + '</td></tr>';
        }
    });

    h += '</tbody></table></div>';
    return h;
};
</script>
