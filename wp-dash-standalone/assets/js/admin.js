/* global wpdash_sa */
'use strict';

// -------------------------------------------------------------------------
// Core helpers
// -------------------------------------------------------------------------

async function wpdashSaAjax(action, data = {}) {
    const body = new URLSearchParams({ action, nonce: wpdash_sa.nonce, ...data });
    const res = await fetch(wpdash_sa.ajax_url, { method: 'POST', body });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

function setLoading(el, state) {
    if (!el) return;
    el.classList.toggle('wpdash-sa-loading', state);
}

function showNotice(msg, type = 'success') {
    const bar = document.createElement('div');
    bar.className = 'wpdash-sa-notice-bar ' + type;
    bar.textContent = msg;
    const container = document.getElementById('wpdash-sa-notice');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(bar);
    setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => bar.remove(), 400);
    }, 3000);
}

function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

function fadeOut(el, ms = 400, cb) {
    el.style.transition = `opacity ${ms}ms`;
    el.style.opacity = '0';
    setTimeout(() => { el.remove(); if (cb) cb(); }, ms);
}

// -------------------------------------------------------------------------
// Plugins
// -------------------------------------------------------------------------

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-plugin-action');
    if (!btn) return;
    const action = btn.dataset.action;
    const slug   = btn.dataset.slug;
    const row    = btn.closest('tr');
    setLoading(row, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_plugin_action', { plugin_action: action, slug });
        if (res.success) {
            showNotice('Plugin ' + action + 'd successfully.');
            setTimeout(() => location.reload(), 800);
        } else {
            setLoading(row, false);
            showNotice('Error: ' + (res.data || 'Unknown error'), 'error');
        }
    } catch { setLoading(row, false); showNotice('Request failed.', 'error'); }
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-plugin-delete');
    if (!btn) return;
    const slug = btn.dataset.slug;
    const name = btn.dataset.name;
    if (!confirm('Delete plugin "' + name + '"? This cannot be undone.')) return;
    const row = btn.closest('tr');
    setLoading(row, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_plugin_action', { plugin_action: 'delete', slug });
        if (res.success) { fadeOut(row); showNotice('Plugin deleted.'); }
        else { setLoading(row, false); showNotice('Delete failed: ' + (res.data || 'Unknown error'), 'error'); }
    } catch { setLoading(row, false); showNotice('Request failed.', 'error'); }
});

// Plugin install
qs('#wpdash-install-plugin-btn')?.addEventListener('click', async () => {
    const input = qs('#wpdash-install-slug');
    const slug  = input?.value.trim();
    if (!slug) { showNotice('Please enter a plugin slug.', 'error'); return; }
    const btn = qs('#wpdash-install-plugin-btn');
    btn.textContent = 'Installing…'; btn.disabled = true;
    try {
        const res = await wpdashSaAjax('wpdash_sa_install_plugin', { slug });
        btn.textContent = 'Install Plugin'; btn.disabled = false;
        if (res.success && res.data?.success !== false) {
            showNotice('Plugin installed successfully!');
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotice((res.data?.message) || 'Install failed', 'error');
        }
    } catch { btn.textContent = 'Install Plugin'; btn.disabled = false; showNotice('Request failed.', 'error'); }
});

// Plugin search filter
qs('#wpdash-plugin-search')?.addEventListener('input', function () {
    const q    = this.value.toLowerCase();
    const rows = qsa('#wpdash-plugins-table tbody tr:not(#wpdash-plugins-empty)');
    rows.forEach(tr => {
        tr.style.display = (tr.dataset.name || '').toLowerCase().includes(q) ? '' : 'none';
    });
    const empty = qs('#wpdash-plugins-empty');
    if (empty) empty.style.display = rows.filter(tr => tr.style.display !== 'none').length === 0 ? '' : 'none';
});

// -------------------------------------------------------------------------
// Themes
// -------------------------------------------------------------------------

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-theme-action');
    if (!btn) return;
    const action     = btn.dataset.action;
    const stylesheet = btn.dataset.stylesheet;
    if (!confirm('Activate this theme?')) return;
    const card = btn.closest('.wpdash-sa-card');
    setLoading(card, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_theme_action', { theme_action: action, stylesheet });
        if (res.success) { showNotice('Theme activated.'); setTimeout(() => location.reload(), 800); }
        else { setLoading(card, false); showNotice('Error: ' + (res.data || 'Unknown error'), 'error'); }
    } catch { setLoading(card, false); showNotice('Request failed.', 'error'); }
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-theme-delete');
    if (!btn) return;
    const stylesheet = btn.dataset.stylesheet;
    const name       = btn.dataset.name;
    if (!confirm('Delete theme "' + name + '"? This cannot be undone.')) return;
    const card = btn.closest('.wpdash-sa-card');
    setLoading(card, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_theme_action', { theme_action: 'delete', stylesheet });
        if (res.success) { fadeOut(card); showNotice('Theme deleted.'); }
        else { setLoading(card, false); showNotice('Delete failed.', 'error'); }
    } catch { setLoading(card, false); showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// Users
// -------------------------------------------------------------------------

qs('#wpdash-toggle-add-user')?.addEventListener('click', () => {
    const form = qs('#wpdash-add-user-form');
    if (!form) return;
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

qs('#wpdash-cancel-add-user')?.addEventListener('click', () => {
    const form = qs('#wpdash-add-user-form');
    if (form) form.style.display = 'none';
});

qs('#wpdash-create-user-btn')?.addEventListener('click', async () => {
    const username = qs('#new-username')?.value.trim();
    const email    = qs('#new-email')?.value.trim();
    const password = qs('#new-password')?.value;
    const role     = qs('#new-role')?.value;
    if (!username || !email) { showNotice('Username and email are required.', 'error'); return; }
    const btn = qs('#wpdash-create-user-btn');
    const fs  = qs('#wpdash-user-form-fieldset');
    if (fs) fs.disabled = true;
    btn.textContent = 'Creating…'; btn.disabled = true;
    try {
        const res = await wpdashSaAjax('wpdash_sa_user_action', { user_action: 'create', username, email, password, role });
        if (fs) fs.disabled = false;
        btn.textContent = 'Create User'; btn.disabled = false;
        if (res.success && res.data?.success !== false) {
            showNotice('User created successfully!');
            setTimeout(() => location.reload(), 800);
        } else { showNotice((res.data?.message) || 'Create failed', 'error'); }
    } catch { if (fs) fs.disabled = false; btn.textContent = 'Create User'; btn.disabled = false; showNotice('Request failed.', 'error'); }
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-user-delete');
    if (!btn) return;
    const userId = btn.dataset.userId;
    const login  = btn.dataset.login;
    if (!confirm('Delete user "' + login + '"? This cannot be undone.')) return;
    const row = btn.closest('tr');
    setLoading(row, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_user_action', { user_action: 'delete', user_id: userId });
        if (res.success) { fadeOut(row); showNotice('User deleted.'); }
        else { setLoading(row, false); showNotice('Delete failed.', 'error'); }
    } catch { setLoading(row, false); showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// Content
// -------------------------------------------------------------------------

document.addEventListener('click', (e) => {
    const tab = e.target.closest('.wpdash-content-tabs .nav-tab');
    if (!tab) return;
    e.preventDefault();
    const tabId = tab.dataset.tab;
    qsa('.wpdash-content-tabs .nav-tab').forEach(t => t.classList.remove('nav-tab-active'));
    tab.classList.add('nav-tab-active');
    qsa('.wpdash-tab-content').forEach(tc => { tc.style.display = 'none'; });
    const target = qs('#tab-' + tabId);
    if (target) target.style.display = 'block';
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-content-action');
    if (!btn) return;
    const action = btn.dataset.action;
    const postId = btn.dataset.postId;
    const row    = btn.closest('tr');
    setLoading(row, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_content_action', { content_action: action, post_id: postId });
        setLoading(row, false);
        if (res.success) { showNotice('Post updated.'); setTimeout(() => location.reload(), 600); }
        else { showNotice('Error: ' + (res.data || 'Unknown'), 'error'); }
    } catch { setLoading(row, false); showNotice('Request failed.', 'error'); }
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-content-delete');
    if (!btn) return;
    const postId = btn.dataset.postId;
    const title  = btn.dataset.title || 'this post';
    if (!confirm('Permanently delete "' + title + '"?')) return;
    const row = btn.closest('tr');
    setLoading(row, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_content_action', { content_action: 'delete', post_id: postId });
        if (res.success) { fadeOut(row); showNotice('Post deleted.'); }
        else { setLoading(row, false); showNotice('Delete failed.', 'error'); }
    } catch { setLoading(row, false); showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// Database
// -------------------------------------------------------------------------

qs('#wpdash-optimize-all')?.addEventListener('click', async () => {
    if (!confirm('Optimize all database tables? This may take a moment.')) return;
    const btn     = qs('#wpdash-optimize-all');
    const spinner = qs('#wpdash-db-spinner');
    btn.textContent = 'Optimizing…'; btn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    try {
        const res = await wpdashSaAjax('wpdash_sa_database_action', { db_action: 'optimize' });
        btn.textContent = 'Optimize All Tables'; btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (res.success) { showNotice('Optimized ' + res.data.tables_optimized + ' tables.'); }
        else { showNotice('Optimization failed.', 'error'); }
    } catch { btn.textContent = 'Optimize All Tables'; btn.disabled = false; if (spinner) spinner.style.display = 'none'; showNotice('Request failed.', 'error'); }
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-cleanup-btn');
    if (!btn) return;
    const type    = btn.dataset.type;
    const origTxt = btn.textContent;
    const spinner = qs('#wpdash-db-spinner');
    btn.disabled = true; btn.textContent = 'Cleaning…';
    if (spinner) spinner.style.display = 'block';
    try {
        const res = await wpdashSaAjax('wpdash_sa_database_action', { db_action: 'cleanup', cleanup_type: type });
        btn.disabled = false; btn.textContent = origTxt;
        if (spinner) spinner.style.display = 'none';
        if (res.success) {
            showNotice('Deleted ' + res.data.deleted + ' ' + type.replace('_', ' ') + ' row(s).');
            const counter = qs('#wpdash-count-' + type);
            if (counter) counter.textContent = '0';
        } else { showNotice('Cleanup failed.', 'error'); }
    } catch { btn.disabled = false; btn.textContent = origTxt; if (spinner) spinner.style.display = 'none'; showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// Security
// -------------------------------------------------------------------------

qs('#wpdash-run-security-check')?.addEventListener('click', async () => {
    const btn     = qs('#wpdash-run-security-check');
    const prog    = qs('#wpdash-security-progress');
    const spinner = qs('#wpdash-security-spinner');
    const res_    = qs('#wpdash-security-results');
    btn.disabled = true;
    if (prog) prog.style.display = 'block';
    if (spinner) spinner.style.display = 'inline-block';
    if (res_) res_.innerHTML = '';
    try {
        const res = await wpdashSaAjax('wpdash_sa_get_security', {});
        btn.disabled = false;
        if (prog) prog.style.display = 'none';
        if (spinner) spinner.style.display = 'none';
        if (res.success && res_) {
            res_.innerHTML = window.wpdashSecurityTemplate ? window.wpdashSecurityTemplate(res.data) : JSON.stringify(res.data, null, 2);
        } else { showNotice('Security check failed.', 'error'); }
    } catch { btn.disabled = false; if (prog) prog.style.display = 'none'; if (spinner) spinner.style.display = 'none'; showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// SEO
// -------------------------------------------------------------------------

qs('#wpdash-run-seo')?.addEventListener('click', async () => {
    const url     = qs('#wpdash-seo-url')?.value.trim();
    const btn     = qs('#wpdash-run-seo');
    const spinner = qs('#wpdash-seo-spinner');
    const res_    = qs('#wpdash-seo-results');
    if (!url) { showNotice('Please enter a URL.', 'error'); return; }
    btn.textContent = 'Auditing…'; btn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (res_) res_.innerHTML = '';
    try {
        const res = await wpdashSaAjax('wpdash_sa_get_seo', { url });
        btn.textContent = 'Run Audit'; btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (res.success && res_) {
            res_.innerHTML = window.wpdashSeoTemplate ? window.wpdashSeoTemplate(res.data) : JSON.stringify(res.data, null, 2);
        } else { showNotice('SEO audit failed.', 'error'); }
    } catch { btn.textContent = 'Run Audit'; btn.disabled = false; if (spinner) spinner.style.display = 'none'; showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// Logs
// -------------------------------------------------------------------------

document.addEventListener('click', (e) => {
    const tab = e.target.closest('.wpdash-log-tabs .nav-tab');
    if (!tab) return;
    e.preventDefault();
    const level = tab.dataset.level;
    qsa('.wpdash-log-tabs .nav-tab').forEach(t => t.classList.remove('nav-tab-active'));
    tab.classList.add('nav-tab-active');
    qsa('#wpdash-logs-table tbody tr').forEach(tr => {
        tr.style.display = (level === 'all' || tr.dataset.level === level) ? '' : 'none';
    });
});

qs('#wpdash-refresh-logs')?.addEventListener('click', () => location.reload());

qs('#wpdash-clear-logs')?.addEventListener('click', async () => {
    if (!confirm('Clear the log file? This cannot be undone.')) return;
    const btn = qs('#wpdash-clear-logs');
    btn.disabled = true;
    try {
        const res = await wpdashSaAjax('wpdash_sa_clear_logs', {});
        btn.disabled = false;
        if (res.success) {
            showNotice('Log file cleared.');
            const tbody = qs('#wpdash-logs-table tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;">Log cleared.</td></tr>';
        } else { showNotice('Clear failed.', 'error'); }
    } catch { btn.disabled = false; showNotice('Request failed.', 'error'); }
});

// -------------------------------------------------------------------------
// Backup
// -------------------------------------------------------------------------

qs('#wpdash-refresh-backup')?.addEventListener('click', () => location.reload());


// -------------------------------------------------------------------------
// Site Management
// -------------------------------------------------------------------------

// Site switcher dropdown
qs('#wpdash-site-switcher')?.addEventListener('change', async function () {
    const siteId = this.value;
    try {
        const res = await wpdashSaAjax('wpdash_sa_switch_site', { site_id: siteId });
        if (res.success) {
            location.reload();
        } else {
            showNotice('Failed to switch site: ' + (res.data || 'Unknown error'), 'error');
        }
    } catch { showNotice('Request failed.', 'error'); }
});

// Test connection (shared between no-sites and settings pages)
async function wpdashTestConnection() {
    const url    = qs('#wpdash-site-url')?.value.trim();
    const token  = qs('#wpdash-site-token')?.value.trim();
    const result = qs('#wpdash-test-result');
    if (!url || !token) {
        if (result) { result.textContent = '⚠ Enter URL and token first.'; result.style.color = '#d63638'; }
        return;
    }
    const btn = qs('#wpdash-test-connection');
    if (btn) { btn.disabled = true; btn.textContent = 'Testing…'; }
    if (result) { result.textContent = ''; }
    try {
        const res = await wpdashSaAjax('wpdash_sa_test_connection', { url, token });
        if (btn) { btn.disabled = false; btn.textContent = 'Test Connection'; }
        if (res.success) {
            if (result) { result.textContent = '✓ Connected! WordPress ' + (res.data.wp_version || '?'); result.style.color = '#065f46'; }
        } else {
            if (result) { result.textContent = '✗ ' + (res.data || 'Connection failed'); result.style.color = '#d63638'; }
        }
    } catch {
        if (btn) { btn.disabled = false; btn.textContent = 'Test Connection'; }
        if (result) { result.textContent = '✗ Request failed'; result.style.color = '#d63638'; }
    }
}

qs('#wpdash-test-connection')?.addEventListener('click', wpdashTestConnection);

// Add site (shared between no-sites and settings pages)
qs('#wpdash-add-site-btn')?.addEventListener('click', async () => {
    const name  = qs('#wpdash-site-name')?.value.trim();
    const url   = qs('#wpdash-site-url')?.value.trim();
    const token = qs('#wpdash-site-token')?.value.trim();
    if (!name || !url || !token) { showNotice('Name, URL, and token are required.', 'error'); return; }
    const btn = qs('#wpdash-add-site-btn');
    btn.textContent = 'Adding…'; btn.disabled = true;
    try {
        const res = await wpdashSaAjax('wpdash_sa_add_site', { name, url, token });
        btn.textContent = 'Add Site'; btn.disabled = false;
        if (res.success) {
            showNotice('Site added successfully!');
            setTimeout(() => location.reload(), 800);
        } else {
            showNotice('Error: ' + (res.data || 'Unknown error'), 'error');
        }
    } catch { btn.textContent = 'Add Site'; btn.disabled = false; showNotice('Request failed.', 'error'); }
});

// Remove site (settings page)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-site-remove');
    if (!btn) return;
    const siteId = btn.dataset.siteId;
    const name   = btn.dataset.name;
    if (!confirm('Remove site "' + name + '"? This cannot be undone.')) return;
    const row = btn.closest('tr');
    setLoading(row, true);
    try {
        const res = await wpdashSaAjax('wpdash_sa_remove_site', { site_id: siteId });
        if (res.success) { fadeOut(row); showNotice('Site removed.'); }
        else { setLoading(row, false); showNotice('Remove failed: ' + (res.data || 'Unknown error'), 'error'); }
    } catch { setLoading(row, false); showNotice('Request failed.', 'error'); }
});

// Switch site (settings page table)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-site-switch');
    if (!btn) return;
    const siteId = btn.dataset.siteId;
    try {
        const res = await wpdashSaAjax('wpdash_sa_switch_site', { site_id: siteId });
        if (res.success) { location.reload(); }
        else { showNotice('Switch failed: ' + (res.data || 'Unknown error'), 'error'); }
    } catch { showNotice('Request failed.', 'error'); }
});

// Ping site from settings table
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wpdash-site-test');
    if (!btn) return;
    const siteId     = btn.dataset.siteId;
    const statusSpan = qs('.wpdash-site-status[data-site-id="' + siteId + '"]');
    const origTxt    = btn.textContent;
    btn.disabled = true; btn.textContent = '…';
    if (statusSpan) { statusSpan.textContent = 'Pinging…'; statusSpan.style.color = '#646970'; }
    try {
        // Use switch_site temporarily to get a client, then test by fetching health via AJAX
        const res = await wpdashSaAjax('wpdash_sa_switch_site', { site_id: siteId });
        if (!res.success) throw new Error(res.data || 'Switch failed');
        const health = await wpdashSaAjax('wpdash_sa_get_health', {});
        btn.disabled = false; btn.textContent = origTxt;
        if (health.success) {
            if (statusSpan) { statusSpan.textContent = '✓ Online (WP ' + (health.data.wp_version || '?') + ')'; statusSpan.style.color = '#065f46'; }
        } else {
            if (statusSpan) { statusSpan.textContent = '✗ Error'; statusSpan.style.color = '#d63638'; }
        }
        // Re-select previously active site
        if (wpdash_sa.active_site && wpdash_sa.active_site !== siteId) {
            await wpdashSaAjax('wpdash_sa_switch_site', { site_id: wpdash_sa.active_site });
        }
    } catch (err) {
        btn.disabled = false; btn.textContent = origTxt;
        if (statusSpan) { statusSpan.textContent = '✗ ' + (err.message || 'Failed'); statusSpan.style.color = '#d63638'; }
    }
});
