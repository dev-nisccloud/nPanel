<?php
/**
 * Order helpers for Nisc Payment Gateway.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Nisc_PG_Order_Service {

	public const META_PAYMENT_ID   = '_nisc_pg_payment_id';
	public const META_CHECKOUT_ID  = '_nisc_pg_checkout_request_id';
	public const META_RECEIPT      = '_nisc_pg_receipt';
	public const META_PHONE        = '_nisc_pg_phone';

	/**
	 * Normalize Kenyan phone to 254XXXXXXXXX.
	 */
	public static function normalize_phone( string $phone ): ?string {
		$digits = preg_replace( '/\D+/', '', $phone );
		if ( ! is_string( $digits ) || '' === $digits ) {
			return null;
		}

		if ( str_starts_with( $digits, '0' ) && 10 === strlen( $digits ) ) {
			$digits = '254' . substr( $digits, 1 );
		} elseif ( 9 === strlen( $digits ) && ! str_starts_with( $digits, '254' ) ) {
			$digits = '254' . $digits;
		}

		if ( ! preg_match( '/^254\d{9}$/', $digits ) ) {
			return null;
		}

		return $digits;
	}

	/**
	 * Apply gateway payment result to a WooCommerce order.
	 *
	 * @param array<string,mixed> $payload Full webhook body.
	 */
	public static function apply_webhook_payload( WC_Order $order, array $payload ): void {
		$payment = isset( $payload['payment'] ) && is_array( $payload['payment'] ) ? $payload['payment'] : array();
		$status  = isset( $payment['status'] ) ? strtoupper( (string) $payment['status'] ) : '';

		$transaction_id = isset( $payload['transactionId'] ) ? (string) $payload['transactionId'] : '';
		if ( $transaction_id ) {
			$order->update_meta_data( self::META_PAYMENT_ID, $transaction_id );
		}

		if ( ! empty( $payment['receiptNumber'] ) ) {
			$order->update_meta_data( self::META_RECEIPT, (string) $payment['receiptNumber'] );
			$order->set_transaction_id( (string) $payment['receiptNumber'] );
		}

		switch ( $status ) {
			case 'SUCCESS':
				if ( ! $order->is_paid() ) {
					$note = sprintf(
						/* translators: %s: M-Pesa receipt */
						__( 'Nisc Payment Gateway: payment confirmed%s.', 'nisc-payment-gateway' ),
						! empty( $payment['receiptNumber'] ) ? ' (Receipt ' . $payment['receiptNumber'] . ')' : ''
					);
					$order->payment_complete( ! empty( $payment['receiptNumber'] ) ? (string) $payment['receiptNumber'] : $transaction_id );
					$order->add_order_note( $note );
				}
				break;

			case 'CANCELLED':
				if ( ! in_array( $order->get_status(), array( 'cancelled', 'refunded', 'completed', 'processing' ), true ) ) {
					$order->update_status(
						'cancelled',
						__( 'Nisc Payment Gateway: customer cancelled the M-Pesa prompt.', 'nisc-payment-gateway' )
					);
				}
				break;

			case 'FAILED':
			default:
				if ( ! in_array( $order->get_status(), array( 'failed', 'refunded', 'completed', 'processing' ), true ) ) {
					$desc = isset( $payment['resultDesc'] ) ? (string) $payment['resultDesc'] : __( 'Payment failed.', 'nisc-payment-gateway' );
					$order->update_status(
						'failed',
						sprintf(
							/* translators: %s: failure reason */
							__( 'Nisc Payment Gateway: %s', 'nisc-payment-gateway' ),
							$desc
						)
					);
				}
				break;
		}

		$order->save();
	}

	public static function find_order_for_webhook( array $payload ): ?WC_Order {
		$reference = isset( $payload['referenceId'] ) ? (string) $payload['referenceId'] : '';
		$metadata  = isset( $payload['metadata'] ) && is_array( $payload['metadata'] ) ? $payload['metadata'] : array();
		$order_id  = isset( $metadata['orderId'] ) ? absint( $metadata['orderId'] ) : 0;

		if ( ! $order_id && $reference && ctype_digit( $reference ) ) {
			$order_id = absint( $reference );
		}

		if ( $order_id ) {
			$order = wc_get_order( $order_id );
			if ( $order instanceof WC_Order ) {
				return $order;
			}
		}

		if ( ! empty( $payload['transactionId'] ) ) {
			$orders = wc_get_orders(
				array(
					'limit'      => 1,
					'meta_key'   => self::META_PAYMENT_ID,
					'meta_value' => (string) $payload['transactionId'],
				)
			);
			if ( ! empty( $orders[0] ) && $orders[0] instanceof WC_Order ) {
				return $orders[0];
			}
		}

		return null;
	}
}
