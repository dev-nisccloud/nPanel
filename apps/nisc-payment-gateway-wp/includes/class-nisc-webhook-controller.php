<?php
/**
 * REST webhook receiver for gateway callbacks.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Nisc_PG_Webhook_Controller {

	public const ROUTE_NAMESPACE = 'nisc-gateway/v1';
	public const ROUTE           = '/webhook';

	public static function register_routes(): void {
		register_rest_route(
			self::ROUTE_NAMESPACE,
			self::ROUTE,
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'handle' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public static function get_webhook_url(): string {
		return rest_url( self::ROUTE_NAMESPACE . self::ROUTE );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle( WP_REST_Request $request ) {
		$raw       = $request->get_body();
		$signature = (string) $request->get_header( 'x-nisc-gateway-signature' );
		$secret    = (string) get_option( 'nisc_pg_webhook_secret', '' );

		if ( '' === $secret ) {
			return new WP_Error(
				'nisc_pg_not_configured',
				__( 'Webhook secret is not configured. Reconnect the gateway in settings.', 'nisc-payment-gateway' ),
				array( 'status' => 503 )
			);
		}

		if ( '' === $signature || ! self::verify_signature( $raw, $signature, $secret ) ) {
			return new WP_Error(
				'nisc_pg_invalid_signature',
				__( 'Invalid webhook signature.', 'nisc-payment-gateway' ),
				array( 'status' => 401 )
			);
		}

		$payload = json_decode( $raw, true );
		if ( ! is_array( $payload ) ) {
			return new WP_Error(
				'nisc_pg_invalid_payload',
				__( 'Invalid JSON payload.', 'nisc-payment-gateway' ),
				array( 'status' => 400 )
			);
		}

		$order = Nisc_PG_Order_Service::find_order_for_webhook( $payload );
		if ( ! $order ) {
			return new WP_Error(
				'nisc_pg_order_not_found',
				__( 'Order not found for this payment.', 'nisc-payment-gateway' ),
				array( 'status' => 404 )
			);
		}

		Nisc_PG_Order_Service::apply_webhook_payload( $order, $payload );

		return new WP_REST_Response(
			array(
				'received'  => true,
				'orderId'   => $order->get_id(),
				'orderStatus' => $order->get_status(),
			),
			200
		);
	}

	private static function verify_signature( string $raw_body, string $signature, string $secret ): bool {
		$expected = hash_hmac( 'sha256', $raw_body, $secret );
		return hash_equals( $expected, $signature );
	}
}
