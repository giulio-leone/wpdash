<?php
defined( 'ABSPATH' ) || exit;

class WP_Dash_SA_Seo_Manager {

    public function audit( string $url ): array {
        $response = wp_remote_get( esc_url_raw( $url ), [
            'timeout'    => 20,
            'user-agent' => 'WPDashStandalone/1.0 SEO-Auditor',
        ] );

        if ( is_wp_error( $response ) ) {
            return [ 'success' => false, 'message' => $response->get_error_message() ];
        }

        $html = wp_remote_retrieve_body( $response );

        if ( empty( $html ) ) {
            return [ 'success' => false, 'message' => 'Empty response body' ];
        }

        libxml_use_internal_errors( true );
        $doc = new DOMDocument();
        $doc->loadHTML( mb_convert_encoding( $html, 'HTML-ENTITIES', 'UTF-8' ) );
        libxml_clear_errors();

        $xpath = new DOMXPath( $doc );

        // Title
        $title_nodes = $xpath->query( '//title' );
        $title       = $title_nodes->length > 0 ? trim( $title_nodes->item( 0 )->textContent ) : '';

        // Meta description
        $meta_desc = '';
        foreach ( $xpath->query( '//meta[@name="description"]' ) as $node ) {
            $meta_desc = $node->getAttribute( 'content' );
        }

        // OG tags
        $og_title = '';
        $og_desc  = '';
        foreach ( $xpath->query( '//meta[@property="og:title"]' ) as $node ) {
            $og_title = $node->getAttribute( 'content' );
        }
        foreach ( $xpath->query( '//meta[@property="og:description"]' ) as $node ) {
            $og_desc = $node->getAttribute( 'content' );
        }

        // Canonical
        $canonical = '';
        foreach ( $xpath->query( '//link[@rel="canonical"]' ) as $node ) {
            $canonical = $node->getAttribute( 'href' );
        }

        // Headings
        $headings = [];
        foreach ( [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ] as $tag ) {
            $nodes        = $xpath->query( "//{$tag}" );
            $headings[$tag] = [
                'count' => $nodes->length,
                'texts' => [],
            ];
            foreach ( $nodes as $node ) {
                $headings[$tag]['texts'][] = trim( $node->textContent );
            }
        }

        return [
            'success'          => true,
            'url'              => $url,
            'title'            => $title,
            'title_length'     => mb_strlen( $title ),
            'meta_description' => $meta_desc,
            'meta_desc_length' => mb_strlen( $meta_desc ),
            'og_title'         => $og_title,
            'og_description'   => $og_desc,
            'canonical'        => $canonical,
            'headings'         => $headings,
        ];
    }
}
