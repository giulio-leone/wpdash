<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Themes</h1>
    <div id="wpdash-sa-notice"></div>

    <div class="wpdash-theme-grid">
        <?php foreach ( $data as $theme ) : ?>
        <div class="wpdash-sa-card" style="padding:0; overflow:hidden; position:relative;">
            <?php if ( $theme['active'] ) : ?>
                <div style="position:absolute; top:10px; right:10px;">
                    <span class="wpdash-sa-badge wpdash-sa-badge--active">Active</span>
                </div>
            <?php endif; ?>
            <?php if ( $theme['screenshot'] ) : ?>
                <img src="<?php echo esc_url( $theme['screenshot'] ); ?>" alt="<?php echo esc_attr( $theme['name'] ); ?>" style="width:100%; height:160px; object-fit:cover; display:block;" />
            <?php else : ?>
                <div style="width:100%; height:160px; background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#999;">No screenshot</div>
            <?php endif; ?>
            <div style="padding:16px;">
                <strong><?php echo esc_html( $theme['name'] ); ?></strong>
                <span style="color:#646970; font-size:12px; margin-left:6px;">v<?php echo esc_html( $theme['version'] ); ?></span>
                <?php if ( $theme['has_update'] ) : ?>
                    <span class="wpdash-sa-badge wpdash-sa-badge--update" style="display:block; margin-top:4px;">Update: <?php echo esc_html( $theme['new_version'] ); ?></span>
                <?php endif; ?>
                <p style="font-size:12px; color:#646970; margin:8px 0;"><?php echo esc_html( wp_trim_words( $theme['description'], 15 ) ); ?></p>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <?php if ( ! $theme['active'] ) : ?>
                        <button class="button button-primary button-small wpdash-theme-action" data-action="activate" data-stylesheet="<?php echo esc_attr( $theme['stylesheet'] ); ?>">Activate</button>
                    <?php endif; ?>
                    <?php if ( ! $theme['active'] ) : ?>
                        <button class="button button-small wpdash-theme-delete wpdash-btn-danger" data-stylesheet="<?php echo esc_attr( $theme['stylesheet'] ); ?>" data-name="<?php echo esc_attr( $theme['name'] ); ?>">Delete</button>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
