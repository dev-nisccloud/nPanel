<?php
/**
 * Connection-test helpers: STK simulation without touching WooCommerce orders.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Nisc_PG_Test_Service {

	public const OPTION_WEBHOOK_LOG = 'nisc_pg_test_webhook_log';
	public const OPTION_PENDING     = 'nisc_pg_test_pending';
	public const MAX_LOG_ENTRIES    = 10;

	/**
	 * Whether a webhook payload is a plugin / simulator test (must not update orders).
	 *
	 * @param array<string,mixed> $payload Webhook body.
	 */
	public static function is_test_payload( array $payload ): bool {
		$metadata = isset( $payload['metadata'] ) && is_array( $payload['metadata'] ) ? $payload['metadata'] : array();

		if ( ! empty( $metadata['test'] ) || ! empty( $metadata['wpPluginTest'] ) || ! empty( $metadata['simulator'] ) ) {
			return true;
		}

		$reference = isset( $payload['referenceId'] ) ? (string) $payload['referenceId'] : '';
		if ( $reference && str_starts_with( $reference, 'wp-test-' ) ) {
			return true;
		}

		$transaction_id = isset( $payload['transactionId'] ) ? (string) $payload['transactionId'] : '';
		if ( $transaction_id && self::is_pending_test_transaction( $transaction_id ) ) {
			return true;
		}

		return false;
	}

	/**
	 * @param array<string,mixed> $payload Full webhook body.
	 * @param array<string,string> $headers Relevant request headers.
	 */
	public static function record_incoming_webhook( array $payload, array $headers = array() ): array {
		$entry = array(
			'id'            => 'tw_' . wp_generate_password( 12, false, false ),
			'receivedAt'    => gmdate( 'c' ),
			'event'         => isset( $payload['event'] ) ? (string) $payload['event'] : '',
			'transactionId' => isset( $payload['transactionId'] ) ? (string) $payload['transactionId'] : '',
			'referenceId'   => isset( $payload['referenceId'] ) ? (string) $payload['referenceId'] : '',
			'paymentStatus' => isset( $payload['payment']['status'] ) ? strtoupper( (string) $payload['payment']['status'] ) : '',
			'headers'       => $headers,
			'payload'       => $payload,
			'orderUpdated'  => false,
		);

		$log = get_option( self::OPTION_WEBHOOK_LOG, array() );
		if ( ! is_array( $log ) ) {
			$log = array();
		}

		array_unshift( $log, $entry );
		$log = array_slice( $log, 0, self::MAX_LOG_ENTRIES );
		update_option( self::OPTION_WEBHOOK_LOG, $log, false );

		$transaction_id = $entry['transactionId'];
		if ( $transaction_id ) {
			self::clear_pending_test_transaction( $transaction_id );
		}

		return $entry;
	}

	/**
	 * @return list<array<string,mixed>>
	 */
	public static function get_webhook_log(): array {
		$log = get_option( self::OPTION_WEBHOOK_LOG, array() );
		return is_array( $log ) ? array_values( $log ) : array();
	}

	public static function clear_webhook_log(): void {
		delete_option( self::OPTION_WEBHOOK_LOG );
	}

	/**
	 * Remember a test payment so a late webhook can still be classified as test-only.
	 *
	 * @param array{transactionId:string,checkoutRequestId?:string,phone?:string,amount?:float|int|string,referenceId?:string} $pending
	 */
	public static function remember_pending_test( array $pending ): void {
		$transaction_id = isset( $pending['transactionId'] ) ? (string) $pending['transactionId'] : '';
		if ( '' === $transaction_id ) {
			return;
		}

		$list = get_option( self::OPTION_PENDING, array() );
		if ( ! is_array( $list ) ) {
			$list = array();
		}

		$list[ $transaction_id ] = array(
			'transactionId'    => $transaction_id,
			'checkoutRequestId'=> isset( $pending['checkoutRequestId'] ) ? (string) $pending['checkoutRequestId'] : '',
			'phone'            => isset( $pending['phone'] ) ? (string) $pending['phone'] : '',
			'amount'           => $pending['amount'] ?? null,
			'referenceId'      => isset( $pending['referenceId'] ) ? (string) $pending['referenceId'] : '',
			'startedAt'        => gmdate( 'c' ),
		);

		// Drop stale pending tests older than 2 hours.
		$cutoff = time() - ( 2 * HOUR_IN_SECONDS );
		foreach ( $list as $id => $row ) {
			$started = isset( $row['startedAt'] ) ? strtotime( (string) $row['startedAt'] ) : 0;
			if ( ! $started || $started < $cutoff ) {
				unset( $list[ $id ] );
			}
		}

		update_option( self::OPTION_PENDING, $list, false );
	}

	public static function is_pending_test_transaction( string $transaction_id ): bool {
		$list = get_option( self::OPTION_PENDING, array() );
		return is_array( $list ) && isset( $list[ $transaction_id ] );
	}

	public static function clear_pending_test_transaction( string $transaction_id ): void {
		$list = get_option( self::OPTION_PENDING, array() );
		if ( ! is_array( $list ) || ! isset( $list[ $transaction_id ] ) ) {
			return;
		}
		unset( $list[ $transaction_id ] );
		update_option( self::OPTION_PENDING, $list, false );
	}

	/**
	 * Find the newest stored test webhook for a transaction id (if any).
	 *
	 * @return array<string,mixed>|null
	 */
	public static function find_webhook_for_transaction( string $transaction_id ): ?array {
		if ( '' === $transaction_id ) {
			return null;
		}
		foreach ( self::get_webhook_log() as $entry ) {
			if ( isset( $entry['transactionId'] ) && (string) $entry['transactionId'] === $transaction_id ) {
				return $entry;
			}
		}
		return null;
	}
}
