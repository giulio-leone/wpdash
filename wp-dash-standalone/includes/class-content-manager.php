<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Content_Manager {

    public function get_content(): array {
        return [
            'posts' => $this->query_content( 'post' ),
            'pages' => $this->query_content( 'page' ),
        ];
    }

    private function query_content( string $post_type ): array {
        $query = new WP_Query( [
            'post_type'      => $post_type,
            'post_status'    => [ 'publish', 'draft', 'trash', 'pending' ],
            'posts_per_page' => 100,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ] );

        $result = [];

        foreach ( $query->posts as $post ) {
            $author   = get_userdata( $post->post_author );
            $result[] = [
                'id'     => $post->ID,
                'title'  => $post->post_title,
                'status' => $post->post_status,
                'author' => $author ? $author->display_name : '—',
                'date'   => $post->post_date,
                'type'   => $post->post_type,
            ];
        }

        wp_reset_postdata();

        return $result;
    }

    public function update_status( int $post_id, string $status ): bool {
        $allowed = [ 'publish', 'draft', 'trash' ];
        if ( ! in_array( $status, $allowed, true ) ) {
            return false;
        }
        $result = wp_update_post( [ 'ID' => $post_id, 'post_status' => $status ] );
        return $result !== 0;
    }

    public function delete( int $post_id ): bool {
        return (bool) wp_delete_post( $post_id, true );
    }
}
