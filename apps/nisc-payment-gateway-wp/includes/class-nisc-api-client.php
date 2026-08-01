<?php
/**
 * HTTP client for Nisc Payment Gateway public API.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Nisc_PG_Api_Client {

	private string $api_key;
	private string $base_url;

	public function __construct( string $api_key, ?string $base_url = null ) {
		$this->api_key  = trim( $api_key );
		$this->base_url = untrailingslashit(
			$base_url ?: (string) apply_filters( 'nisc_pg_api_base_url', NISC_PG_DEFAULT_API_BASE )
		);
	}

	public function get_base_url(): string {
		return $this->base_url;
	}

	/**
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function get_webhook(): array {
		return $this->request( 'GET', '/v1/webhook' );
	}

	/**
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function register_webhook( string $url ): array {
		return $this->request(
			'PUT',
			'/v1/webhook',
			array( 'url' => $url )
		);
	}

	/**
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function clear_webhook(): array {
		return $this->request( 'DELETE', '/v1/webhook' );
	}

	/**
	 * @param array<string,mixed> $payload
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function create_payment( array $payload ): array {
		return $this->request( 'POST', '/v1/payments', $payload );
	}

	/**
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function get_payment( string $payment_id ): array {
		return $this->request( 'GET', '/v1/payments/' . rawurlencode( $payment_id ) );
	}

	/**
	 * Diagnostics: gateway auth + M-Pesa OAuth token (no STK).
	 *
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function test_connection(): array {
		return $this->request( 'GET', '/v1/connection' );
	}

	/**
	 * Unauthenticated health ping (server reachable).
	 *
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	public function health(): array {
		$args = array(
			'method'  => 'GET',
			'timeout' => 15,
			'headers' => array(
				'Accept'     => 'application/json',
				'User-Agent' => 'Nisc-Payment-Gateway-WP/' . NISC_PG_VERSION,
			),
		);

		$response = wp_remote_request( $this->base_url . '/health', $args );

		if ( is_wp_error( $response ) ) {
			return array(
				'ok'     => false,
				'status' => 0,
				'error'  => array(
					'code'    => 'HTTP_ERROR',
					'message' => $response->get_error_message(),
				),
			);
		}

		$status  = (int) wp_remote_retrieve_response_code( $response );
		$raw     = (string) wp_remote_retrieve_body( $response );
		$decoded = json_decode( $raw, true );
		$data    = is_array( $decoded ) ? $decoded : array();

		if ( $status >= 200 && $status < 300 ) {
			return array(
				'ok'     => true,
				'status' => $status,
				'data'   => $data,
			);
		}

		return array(
			'ok'     => false,
			'status' => $status,
			'error'  => array(
				'code'    => 'API_ERROR',
				'message' => __( 'Health check failed.', 'nisc-payment-gateway-for-woocommerce' ),
			),
			'data'   => $data,
		);
	}

	/**
	 * @param array<string,mixed>|null $body
	 * @return array{ok:bool,status:int,data?:array<string,mixed>,error?:array{code:string,message:string}}
	 */
	private function request( string $method, string $path, ?array $body = null ): array {
		if ( '' === $this->api_key ) {
			return array(
				'ok'     => false,
				'status' => 0,
				'error'  => array(
					'code'    => 'MISSING_API_KEY',
					'message' => __( 'API key is missing.', 'nisc-payment-gateway-for-woocommerce' ),
				),
			);
		}

		$args = array(
			'method'  => $method,
			'timeout' => 30,
			'headers' => array(
				'Authorization' => 'Bearer ' . $this->api_key,
				'Accept'        => 'application/json',
				'Content-Type'  => 'application/json',
				'User-Agent'    => 'Nisc-Payment-Gateway-WP/' . NISC_PG_VERSION,
			),
		);

		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( $this->base_url . $path, $args );

		if ( is_wp_error( $response ) ) {
			return array(
				'ok'     => false,
				'status' => 0,
				'error'  => array(
					'code'    => 'HTTP_ERROR',
					'message' => $response->get_error_message(),
				),
			);
		}

		$status   = (int) wp_remote_retrieve_response_code( $response );
		$raw      = (string) wp_remote_retrieve_body( $response );
		$decoded  = json_decode( $raw, true );
		$data     = is_array( $decoded ) ? $decoded : array();

		if ( $status >= 200 && $status < 300 ) {
			return array(
				'ok'     => true,
				'status' => $status,
				'data'   => $data,
			);
		}

		$error = array(
			'code'    => isset( $data['error']['code'] ) ? (string) $data['error']['code'] : 'API_ERROR',
			'message' => isset( $data['error']['message'] ) ? (string) $data['error']['message'] : __( 'Request failed.', 'nisc-payment-gateway-for-woocommerce' ),
		);

		return array(
			'ok'     => false,
			'status' => $status,
			'error'  => $error,
			'data'   => $data,
		);
	}
}
