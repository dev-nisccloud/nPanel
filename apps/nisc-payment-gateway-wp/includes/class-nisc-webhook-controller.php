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
				array(
					'methods'             => 'POST',
					'callback'            => array( self::class, 'handle' ),
					'permission_callback' => '__return_true',
				),
				array(
					'methods'             => 'GET',
					'callback'            => array( self::class, 'handle_get' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Handle GET requests to webhook endpoint (for testing/verification).
	 *
	 * @return WP_REST_Response
	 */
	public static function handle_get(): WP_REST_Response {
		$secret = (string) get_option( 'nisc_pg_webhook_secret', '' );
		$configured = '' !== $secret;

		return new WP_REST_Response(
			array(
				'service'     => 'Nisc Payment Gateway Webhook',
				'status'      => 'online',
				'configured'  => $configured,
				'message'     => $configured 
					? 'Webhook endpoint is active and configured. Ready to receive POST callbacks.'
					: 'Webhook endpoint is online but not configured. Connect your API key in WooCommerce settings.',
				'timestamp'   => gmdate( 'c' ),
				'version'     => NISC_PG_VERSION,
			),
			200
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

		self::log_webhook_attempt( 'incoming', array(
			'has_body'      => ! empty( $raw ),
			'body_length'   => strlen( $raw ),
			'has_signature' => ! empty( $signature ),
			'has_secret'    => ! empty( $secret ),
			'headers'       => array(
				'event'    => (string) $request->get_header( 'x-nisc-gateway-event' ),
				'merchant' => (string) $request->get_header( 'x-nisc-gateway-merchant' ),
			),
		) );

		if ( '' === $secret ) {
			self::log_webhook_attempt( 'error', array( 'reason' => 'no_secret' ) );
			return new WP_Error(
				'nisc_pg_not_configured',
				__( 'Webhook secret is not configured. Reconnect the gateway in settings.', 'nisc-payment-gateway-for-woocommerce' ),
				array( 'status' => 503 )
			);
		}

		if ( '' === $signature || ! self::verify_signature( $raw, $signature, $secret ) ) {
			self::log_webhook_attempt( 'error', array(
				'reason'         => 'invalid_signature',
				'signature_sent' => ! empty( $signature ),
			) );
			return new WP_Error(
				'nisc_pg_invalid_signature',
				__( 'Invalid webhook signature.', 'nisc-payment-gateway-for-woocommerce' ),
				array( 'status' => 401 )
			);
		}

		$payload = json_decode( $raw, true );
		if ( ! is_array( $payload ) ) {
			self::log_webhook_attempt( 'error', array( 'reason' => 'invalid_json' ) );
			return new WP_Error(
				'nisc_pg_invalid_payload',
				__( 'Invalid JSON payload.', 'nisc-payment-gateway-for-woocommerce' ),
				array( 'status' => 400 )
			);
		}

		// Connection tests / simulator payments: accept + preview, never touch orders.
		if ( Nisc_PG_Test_Service::is_test_payload( $payload ) ) {
			$entry = Nisc_PG_Test_Service::record_incoming_webhook(
				$payload,
				array(
					'x-nisc-gateway-event'    => (string) $request->get_header( 'x-nisc-gateway-event' ),
					'x-nisc-gateway-merchant' => (string) $request->get_header( 'x-nisc-gateway-merchant' ),
					'x-nisc-gateway-signature'=> $signature ? 'present' : '',
				)
			);

			self::log_webhook_attempt( 'success', array(
				'type'      => 'test',
				'previewId' => $entry['id'],
			) );

			return new WP_REST_Response(
				array(
					'received'     => true,
					'test'         => true,
					'orderUpdated' => false,
					'previewId'    => $entry['id'],
				),
				200
			);
		}

		$order = Nisc_PG_Order_Service::find_order_for_webhook( $payload );
		if ( ! $order ) {
			self::log_webhook_attempt( 'error', array(
				'reason'  => 'order_not_found',
				'payload' => wp_json_encode( $payload ),
			) );
			return new WP_Error(
				'nisc_pg_order_not_found',
				__( 'Order not found for this payment.', 'nisc-payment-gateway-for-woocommerce' ),
				array( 'status' => 404 )
			);
		}

		Nisc_PG_Order_Service::apply_webhook_payload( $order, $payload );

		self::log_webhook_attempt( 'success', array(
			'type'        => 'order',
			'orderId'     => $order->get_id(),
			'orderStatus' => $order->get_status(),
		) );

		return new WP_REST_Response(
			array(
				'received'    => true,
				'orderId'     => $order->get_id(),
				'orderStatus' => $order->get_status(),
			),
			200
		);
	}

	/**
	 * Log webhook attempts for debugging.
	 *
	 * @param string              $type Type of log entry.
	 * @param array<string,mixed> $data Additional data.
	 */
	private static function log_webhook_attempt( string $type, array $data ): void {
		if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
			return;
		}

		$log = get_option( 'nisc_pg_webhook_log', array() );
		if ( ! is_array( $log ) ) {
			$log = array();
		}

		$log[] = array(
			'timestamp' => gmdate( 'c' ),
			'type'      => $type,
			'data'      => $data,
		);

		$log = array_slice( $log, -50 );

		update_option( 'nisc_pg_webhook_log', $log, false );
	}

	private static function verify_signature( string $raw_body, string $signature, string $secret ): bool {
		$expected = hash_hmac( 'sha256', $raw_body, $secret );
		return hash_equals( $expected, $signature );
	}
}
