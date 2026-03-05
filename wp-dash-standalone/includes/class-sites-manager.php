<?php
defined( 'ABSPATH' ) || exit;

class WPDash_SA_Sites_Manager {
    const OPTION_KEY = 'wpdash_sa_sites';

    public static function get_sites(): array {
        return get_option( self::OPTION_KEY, [] );
    }

    public static function add_site( string $name, string $url, string $token ): array {
        $sites      = self::get_sites();
        $id         = uniqid( 'site_', true );
        $sites[$id] = [
            'id'    => $id,
            'name'  => $name,
            'url'   => rtrim( $url, '/' ),
            'token' => $token,
        ];
        update_option( self::OPTION_KEY, $sites );
        return $sites[$id];
    }

    public static function remove_site( string $id ): bool {
        $sites = self::get_sites();
        if ( ! isset( $sites[$id] ) ) {
            return false;
        }
        unset( $sites[$id] );
        update_option( self::OPTION_KEY, $sites );
        return true;
    }

    public static function get_site( string $id ): ?array {
        $sites = self::get_sites();
        return $sites[$id] ?? null;
    }

    public static function get_active_site_id(): ?string {
        $val = get_user_meta( get_current_user_id(), 'wpdash_sa_active_site', true );
        return ( $val && is_string( $val ) ) ? $val : null;
    }

    public static function set_active_site( string $id ): void {
        update_user_meta( get_current_user_id(), 'wpdash_sa_active_site', $id );
    }

    public static function get_bridge_client( ?string $site_id = null ): ?WPDash_SA_Bridge_Client {
        $id = $site_id ?? self::get_active_site_id();
        if ( ! $id ) {
            return null;
        }
        $site = self::get_site( $id );
        if ( ! $site ) {
            return null;
        }
        return new WPDash_SA_Bridge_Client( $site['url'], $site['token'] );
    }
}
