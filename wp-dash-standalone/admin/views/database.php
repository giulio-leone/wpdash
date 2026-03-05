<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap wpdash-sa-wrap">
    <h1>WP Dash — Database</h1>
    <div id="wpdash-sa-notice"></div>

    <div class="wpdash-action-row">
        <button class="button button-primary" id="wpdash-optimize-all">Optimize All Tables</button>
    </div>
    <div class="wpdash-sa-spinner" id="wpdash-db-spinner" style="display:none; margin:10px 0;"></div>

    <?php
    $total_data  = 0;
    $total_index = 0;
    $total_rows  = 0;
    foreach ( $data as $t ) {
        $total_data  += $t['data_size'];
        $total_index += $t['index_size'];
        $total_rows  += $t['rows'];
    }
    ?>

    <table class="wp-list-table widefat fixed striped wpdash-db-table">
        <thead>
            <tr>
                <th>Table Name</th>
                <th>Rows</th>
                <th>Data Size (MB)</th>
                <th>Index Size (MB)</th>
                <th>Total (MB)</th>
                <th>Engine</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $data as $table ) : ?>
            <tr>
                <td><code><?php echo esc_html( $table['name'] ); ?></code></td>
                <td><?php echo esc_html( number_format( $table['rows'] ) ); ?></td>
                <td><?php echo esc_html( $table['data_size'] ); ?></td>
                <td><?php echo esc_html( $table['index_size'] ); ?></td>
                <td><strong><?php echo esc_html( $table['total_size'] ); ?></strong></td>
                <td><?php echo esc_html( $table['engine'] ); ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
        <tfoot>
            <tr style="font-weight:bold; background:#f6f7f7;">
                <td>Total (<?php echo count( $data ); ?> tables)</td>
                <td><?php echo esc_html( number_format( $total_rows ) ); ?></td>
                <td><?php echo esc_html( round( $total_data, 3 ) ); ?></td>
                <td><?php echo esc_html( round( $total_index, 3 ) ); ?></td>
                <td><?php echo esc_html( round( $total_data + $total_index, 3 ) ); ?></td>
                <td></td>
            </tr>
        </tfoot>
    </table>

    <hr />
    <h2>Cleanup</h2>
    <table class="wp-list-table widefat fixed striped" style="max-width:600px;">
        <thead>
            <tr><th>Type</th><th>Count</th><th>Action</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>Transients</td>
                <td id="wpdash-count-transients"><?php echo esc_html( $counts['transients'] ); ?></td>
                <td><button class="button button-small wpdash-cleanup-btn" data-type="transients">Clean Transients</button></td>
            </tr>
            <tr>
                <td>Spam Comments</td>
                <td id="wpdash-count-spam"><?php echo esc_html( $counts['spam'] ); ?></td>
                <td><button class="button button-small wpdash-cleanup-btn" data-type="spam">Clean Spam</button></td>
            </tr>
            <tr>
                <td>Post Revisions</td>
                <td id="wpdash-count-revisions"><?php echo esc_html( $counts['revisions'] ); ?></td>
                <td><button class="button button-small wpdash-cleanup-btn" data-type="revisions">Clean Revisions</button></td>
            </tr>
            <tr>
                <td>Auto Drafts</td>
                <td id="wpdash-count-auto_drafts"><?php echo esc_html( $counts['auto_drafts'] ); ?></td>
                <td><button class="button button-small wpdash-cleanup-btn" data-type="auto_drafts">Clean Auto Drafts</button></td>
            </tr>
        </tbody>
    </table>
</div>
