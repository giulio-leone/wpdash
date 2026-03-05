<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Plugins</h1>
    <div id="wpdash-sa-notice"></div>

    <p>
        <input type="text" id="wpdash-plugin-search" placeholder="Search plugins…" class="regular-text" />
    </p>

    <table class="wp-list-table widefat fixed striped" id="wpdash-plugins-table">
        <thead>
            <tr>
                <th style="width:30%">Plugin Name</th>
                <th style="width:10%">Version</th>
                <th style="width:10%">Status</th>
                <th style="width:25%">Author</th>
                <th style="width:25%">Actions</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $data as $plugin ) : ?>
            <tr data-slug="<?php echo esc_attr( $plugin['slug'] ); ?>" data-name="<?php echo esc_attr( strtolower( $plugin['name'] ) ); ?>">
                <td>
                    <strong><?php echo esc_html( $plugin['name'] ); ?></strong>
                    <?php if ( $plugin['has_update'] ) : ?>
                        <span class="wpdash-sa-badge wpdash-sa-badge--update">Update: <?php echo esc_html( $plugin['new_version'] ); ?></span>
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html( $plugin['version'] ); ?></td>
                <td>
                    <?php if ( $plugin['active'] ) : ?>
                        <span class="wpdash-sa-badge wpdash-sa-badge--active">Active</span>
                    <?php else : ?>
                        <span class="wpdash-sa-badge wpdash-sa-badge--inactive">Inactive</span>
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html( wp_strip_all_tags( $plugin['author'] ) ); ?></td>
                <td>
                    <?php if ( $plugin['active'] ) : ?>
                        <button class="button button-small wpdash-plugin-action" data-action="deactivate" data-slug="<?php echo esc_attr( $plugin['slug'] ); ?>">Deactivate</button>
                    <?php else : ?>
                        <button class="button button-small button-primary wpdash-plugin-action" data-action="activate" data-slug="<?php echo esc_attr( $plugin['slug'] ); ?>">Activate</button>
                    <?php endif; ?>
                    <?php if ( $plugin['has_update'] ) : ?>
                        <button class="button button-small wpdash-plugin-action" data-action="update" data-slug="<?php echo esc_attr( $plugin['slug'] ); ?>">Update</button>
                    <?php endif; ?>
                    <button class="button button-small wpdash-plugin-delete wpdash-btn-danger" data-slug="<?php echo esc_attr( $plugin['slug'] ); ?>" data-name="<?php echo esc_attr( $plugin['name'] ); ?>">Delete</button>
                </td>
            </tr>
        <?php endforeach; ?>
        <tr id="wpdash-plugins-empty" style="display:none;"><td colspan="5" class="wpdash-sa-empty"><span class="dashicons dashicons-admin-plugins"></span>No plugins found.</td></tr>
        </tbody>
    </table>

    <div class="wpdash-sa-card" style="margin-top:20px; padding:20px;">
        <h2>Install Plugin from WordPress.org</h2>
        <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="wpdash-install-slug" placeholder="Plugin slug (e.g. contact-form-7)" class="regular-text" />
            <div id="wpdash-install-btn-wrap">
                <button class="button button-primary" id="wpdash-install-plugin-btn">Install Plugin</button>
            </div>
        </div>
        <p class="description">Enter the plugin slug from WordPress.org and click Install.</p>
    </div>
</div>
