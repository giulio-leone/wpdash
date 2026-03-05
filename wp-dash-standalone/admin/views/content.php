<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Content</h1>
    <div id="wpdash-sa-notice"></div>

    <nav class="nav-tab-wrapper wpdash-content-tabs">
        <a href="#tab-posts" class="nav-tab nav-tab-active" data-tab="posts">Posts (<?php echo count( $data['posts'] ); ?>)</a>
        <a href="#tab-pages" class="nav-tab" data-tab="pages">Pages (<?php echo count( $data['pages'] ); ?>)</a>
    </nav>

    <?php foreach ( [ 'posts' => $data['posts'], 'pages' => $data['pages'] ] as $type => $items ) : ?>
    <div id="tab-<?php echo esc_attr( $type ); ?>" class="wpdash-tab-content" <?php echo $type !== 'posts' ? 'style="display:none;"' : ''; ?>>
        <table class="wp-list-table widefat fixed striped" style="margin-top:10px;">
            <thead>
                <tr>
                    <th style="width:35%">Title</th>
                    <th style="width:10%">Status</th>
                    <th style="width:15%">Author</th>
                    <th style="width:15%">Date</th>
                    <th style="width:25%">Actions</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ( $items as $post ) : ?>
                <tr data-post-id="<?php echo esc_attr( $post['id'] ); ?>">
                    <td>
                        <strong>
                            <a href="<?php echo esc_url( get_edit_post_link( $post['id'] ) ); ?>" target="_blank">
                                <?php echo esc_html( $post['title'] ?: '(no title)' ); ?>
                            </a>
                        </strong>
                    </td>
                    <td>
                        <?php
                        $badge_class = 'wpdash-sa-badge--inactive';
                        if ( $post['status'] === 'publish' ) $badge_class = 'wpdash-sa-badge--active';
                        if ( $post['status'] === 'draft' )   $badge_class = 'wpdash-sa-badge--update';
                        ?>
                        <span class="wpdash-sa-badge <?php echo esc_attr( $badge_class ); ?>"><?php echo esc_html( $post['status'] ); ?></span>
                    </td>
                    <td><?php echo esc_html( $post['author'] ); ?></td>
                    <td><?php echo esc_html( date( 'Y-m-d', strtotime( $post['date'] ) ) ); ?></td>
                    <td>
                        <?php if ( $post['status'] !== 'publish' ) : ?>
                            <button class="button button-small wpdash-content-action" data-action="publish" data-post-id="<?php echo esc_attr( $post['id'] ); ?>">Publish</button>
                        <?php endif; ?>
                        <?php if ( $post['status'] !== 'draft' ) : ?>
                            <button class="button button-small wpdash-content-action" data-action="draft" data-post-id="<?php echo esc_attr( $post['id'] ); ?>">Draft</button>
                        <?php endif; ?>
                        <?php if ( $post['status'] !== 'trash' ) : ?>
                            <button class="button button-small wpdash-content-action wpdash-btn-danger" data-action="trash" data-post-id="<?php echo esc_attr( $post['id'] ); ?>">Trash</button>
                        <?php endif; ?>
                        <button class="button button-small wpdash-content-delete wpdash-btn-danger" data-post-id="<?php echo esc_attr( $post['id'] ); ?>" data-title="<?php echo esc_attr( $post['title'] ); ?>">Delete</button>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if ( empty( $items ) ) : ?>
                <tr><td colspan="5" class="wpdash-sa-empty">
                    <span class="dashicons <?php echo $type === 'posts' ? 'dashicons-admin-post' : 'dashicons-page'; ?>"></span>
                    No <?php echo esc_html( $type ); ?> found.
                </td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php endforeach; ?>
</div>
