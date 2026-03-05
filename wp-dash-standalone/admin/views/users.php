<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Users</h1>
    <div id="wpdash-sa-notice"></div>

    <p>
        <button class="button button-primary" id="wpdash-toggle-add-user">+ Add User</button>
    </p>

    <div id="wpdash-add-user-form" style="display:none; background:#fff; border:1px solid #ddd; padding:20px; margin-bottom:20px; max-width:500px;">
        <h3 style="margin-top:0;">Create New User</h3>
        <fieldset id="wpdash-user-form-fieldset" style="border:none; margin:0; padding:0;">
        <table class="form-table" style="margin:0;">
            <tr>
                <th><label for="new-username">Username</label></th>
                <td><input type="text" id="new-username" class="regular-text" required /></td>
            </tr>
            <tr>
                <th><label for="new-email">Email</label></th>
                <td><input type="email" id="new-email" class="regular-text" required /></td>
            </tr>
            <tr>
                <th><label for="new-password">Password</label></th>
                <td><input type="password" id="new-password" class="regular-text" placeholder="Leave blank to auto-generate" /></td>
            </tr>
            <tr>
                <th><label for="new-role">Role</label></th>
                <td>
                    <select id="new-role">
                        <option value="subscriber">Subscriber</option>
                        <option value="contributor">Contributor</option>
                        <option value="author">Author</option>
                        <option value="editor">Editor</option>
                        <option value="administrator">Administrator</option>
                    </select>
                </td>
            </tr>
        </table>
        </fieldset>
        <p>
            <button class="button button-primary" id="wpdash-create-user-btn">Create User</button>
            <button class="button" id="wpdash-cancel-add-user">Cancel</button>
        </p>
    </div>

    <table class="wp-list-table widefat fixed striped" id="wpdash-users-table">
        <thead>
            <tr>
                <th>Login</th>
                <th>Email</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $data as $user ) : ?>
            <tr data-user-id="<?php echo esc_attr( $user['id'] ); ?>">
                <td><strong><?php echo esc_html( $user['login'] ); ?></strong></td>
                <td><?php echo esc_html( $user['email'] ); ?></td>
                <td><?php echo esc_html( $user['display_name'] ); ?></td>
                <td><?php echo esc_html( implode( ', ', $user['roles'] ) ); ?></td>
                <td><?php echo esc_html( date( 'Y-m-d', strtotime( $user['registered'] ) ) ); ?></td>
                <td>
                    <?php if ( $user['id'] !== get_current_user_id() ) : ?>
                        <button class="button button-small wpdash-user-delete wpdash-btn-danger" data-user-id="<?php echo esc_attr( $user['id'] ); ?>" data-login="<?php echo esc_attr( $user['login'] ); ?>">Delete</button>
                    <?php else : ?>
                        <em>(current user)</em>
                    <?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
        <tbody id="wpdash-users-empty-state" style="display:none;"><tr><td colspan="6" class="wpdash-sa-empty"><span class="dashicons dashicons-admin-users"></span>No users found.</td></tr></tbody>
    </table>
</div>
