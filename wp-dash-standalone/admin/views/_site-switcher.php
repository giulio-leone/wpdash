<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wpdash-site-bar">
    <span class="wpdash-site-bar__label">Remote Site:</span>
    <?php if ( ! empty( $sites ) ) : ?>
        <select id="wpdash-site-switcher">
            <?php foreach ( $sites as $id => $site ) : ?>
                <option value="<?php echo esc_attr( $id ); ?>" <?php selected( $id, $active_id ); ?>>
                    <?php echo esc_html( $site['name'] ); ?> — <?php echo esc_html( $site['url'] ); ?>
                </option>
            <?php endforeach; ?>
        </select>
    <?php endif; ?>
    <?php if ( $active_site ) : ?>
        <span class="wpdash-site-bar__url"><?php echo esc_html( $active_site['url'] ); ?></span>
    <?php endif; ?>
    <a href="<?php echo esc_url( admin_url( 'admin.php?page=wp-dash-sa-settings' ) ); ?>" class="button button-small" style="margin-left:auto;">⚙ Manage Sites</a>
</div>
