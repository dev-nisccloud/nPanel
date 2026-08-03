<?php
/**
 * Plugin bootstrap.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Nisc_PG_Plugin {

	private static ?self $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function init(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', array( $this, 'missing_woocommerce_notice' ) );
			return;
		}

		add_action( 'rest_api_init', array( Nisc_PG_Webhook_Controller::class, 'register_routes' ) );
		add_filter( 'woocommerce_payment_gateways', array( $this, 'register_gateway' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
		add_filter( 'plugin_action_links_' . NISC_PG_BASENAME, array( $this, 'action_links' ) );
		add_action( 'wp_ajax_nisc_pg_connect', array( $this, 'ajax_connect' ) );
		add_action( 'wp_ajax_nisc_pg_disconnect', array( $this, 'ajax_disconnect' ) );
		add_action( 'wp_ajax_nisc_pg_refresh_status', array( $this, 'ajax_refresh_status' ) );
		add_action( 'wp_ajax_nisc_pg_connection_test', array( $this, 'ajax_connection_test' ) );
		add_action( 'wp_ajax_nisc_pg_send_test_stk', array( $this, 'ajax_send_test_stk' ) );
		add_action( 'wp_ajax_nisc_pg_poll_test', array( $this, 'ajax_poll_test' ) );
		add_action( 'wp_ajax_nisc_pg_get_test_webhooks', array( $this, 'ajax_get_test_webhooks' ) );
		add_action( 'wp_ajax_nisc_pg_clear_test_webhooks', array( $this, 'ajax_clear_test_webhooks' ) );
		add_action( 'wp_ajax_nisc_pg_get_webhook_log', array( $this, 'ajax_get_webhook_log' ) );
		add_action( 'wp_ajax_nisc_pg_clear_webhook_log', array( $this, 'ajax_clear_webhook_log' ) );
		add_action( 'woocommerce_blocks_loaded', array( $this, 'register_blocks_support' ) );

		Nisc_PG_Dokan_Integration::init();
	}

	/**
	 * @param array<int,string> $gateways Gateways.
	 * @return array<int,string>
	 */
	public function register_gateway( array $gateways ): array {
		require_once NISC_PG_PATH . 'includes/class-nisc-wc-gateway.php';
		$gateways[] = 'Nisc_PG_WC_Gateway';
		return $gateways;
	}

	public function enqueue_admin_assets( string $hook ): void {
		if ( 'woocommerce_page_wc-settings' !== $hook ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$section = isset( $_GET['section'] ) ? sanitize_text_field( wp_unslash( $_GET['section'] ) ) : '';
		if ( 'nisc_payment_gateway' !== $section ) {
			return;
		}

		wp_enqueue_style(
			'nisc-pg-admin',
			NISC_PG_URL . 'assets/css/admin.css',
			array(),
			NISC_PG_VERSION
		);

		wp_enqueue_script(
			'nisc-pg-admin',
			NISC_PG_URL . 'assets/js/admin.js',
			array( 'jquery' ),
			NISC_PG_VERSION,
			true
		);

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$connected = 'yes' === ( $settings['connected'] ?? 'no' );

		wp_localize_script(
			'nisc-pg-admin',
			'niscPgAdmin',
			array(
				'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
				'nonce'        => wp_create_nonce( 'nisc_pg_admin' ),
				'connected'    => $connected,
				'webhookUrl'   => Nisc_PG_Webhook_Controller::get_webhook_url(),
				'i18n'         => array(
					'connecting'      => __( 'Connecting…', 'nisc-payment-gateway-for-woocommerce' ),
					'disconnecting'   => __( 'Disconnecting…', 'nisc-payment-gateway-for-woocommerce' ),
					'refreshing'      => __( 'Checking…', 'nisc-payment-gateway-for-woocommerce' ),
					'connectOk'       => __( 'Connected. Webhook registered automatically.', 'nisc-payment-gateway-for-woocommerce' ),
					'connectFail'     => __( 'Could not connect. Check your API key and try again.', 'nisc-payment-gateway-for-woocommerce' ),
					'disconnected'    => __( 'Disconnected.', 'nisc-payment-gateway-for-woocommerce' ),
					'sendingStk'      => __( 'Sending STK…', 'nisc-payment-gateway-for-woocommerce' ),
					'sendTestStk'     => __( 'Send test STK', 'nisc-payment-gateway-for-woocommerce' ),
					'stkSent'         => __( 'STK sent  enter your M-Pesa PIN on the phone.', 'nisc-payment-gateway-for-woocommerce' ),
					'waitingPin'      => __( 'Waiting for PIN…', 'nisc-payment-gateway-for-woocommerce' ),
					'testSuccess'     => __( 'Test payment confirmed. Webhook received  no order was updated.', 'nisc-payment-gateway-for-woocommerce' ),
					'testCancelled'   => __( 'You cancelled the M-Pesa prompt. Webhook still received for preview.', 'nisc-payment-gateway-for-woocommerce' ),
					'testFailed'      => __( 'Payment failed. Webhook still received for preview.', 'nisc-payment-gateway-for-woocommerce' ),
					'testTimeout'     => __( 'Timed out waiting for a response. Check your phone or try again.', 'nisc-payment-gateway-for-woocommerce' ),
					'phoneRequired'   => __( 'Enter the M-Pesa number that should receive the prompt.', 'nisc-payment-gateway-for-woocommerce' ),
					'phoneInvalid'    => __( 'Enter a valid Kenyan number (e.g. 07XXXXXXXX).', 'nisc-payment-gateway-for-woocommerce' ),
					'amountInvalid'   => __( 'Amount must be at least 1 KES.', 'nisc-payment-gateway-for-woocommerce' ),
					'webhookWaiting'  => __( 'Waiting for webhook…', 'nisc-payment-gateway-for-woocommerce' ),
					'webhookReceived' => __( 'Webhook received', 'nisc-payment-gateway-for-woocommerce' ),
					'clearLog'          => __( 'Clear previews', 'nisc-payment-gateway-for-woocommerce' ),
					'noWebhooksYet'     => __( 'No test webhooks yet. Send an STK and complete (or cancel) the prompt.', 'nisc-payment-gateway-for-woocommerce' ),
					'connectionTesting' => __( 'Testing connection…', 'nisc-payment-gateway-for-woocommerce' ),
					'connectionTest'    => __( 'Connection test', 'nisc-payment-gateway-for-woocommerce' ),
					'connectionOk'      => __( 'Connection healthy', 'nisc-payment-gateway-for-woocommerce' ),
					'connectionFail'    => __( 'Connection test failed', 'nisc-payment-gateway-for-woocommerce' ),
					'connectFirst'      => __( 'Connect with an API key first, then run Connection test.', 'nisc-payment-gateway-for-woocommerce' ),
				),
			)
		);
	}

	public function enqueue_frontend_assets(): void {
		if ( ! function_exists( 'is_order_received_page' ) || ! is_order_received_page() ) {
			return;
		}

		wp_enqueue_style(
			'nisc-pg-frontend',
			NISC_PG_URL . 'assets/css/admin.css',
			array(),
			NISC_PG_VERSION
		);
	}

	/**
	 * @param array<string,string> $links Links.
	 * @return array<string,string>
	 */
	public function action_links( array $links ): array {
		$url = admin_url( 'admin.php?page=wc-settings&tab=checkout&section=nisc_payment_gateway' );
		$links = array_merge(
			array(
				'settings' => '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'nisc-payment-gateway-for-woocommerce' ) . '</a>',
			),
			$links
		);
		return $links;
	}

	public function missing_woocommerce_notice(): void {
		echo '<div class="notice notice-error"><p>';
		echo esc_html__( 'Nisc Payment Gateway requires WooCommerce to be installed and active.', 'nisc-payment-gateway-for-woocommerce' );
		echo '</p></div>';
	}

	public function ajax_connect(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		if ( '' === $api_key ) {
			wp_send_json_error( array( 'message' => __( 'Please paste your API key.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		if ( ! preg_match( '/^npg_(test|live|sandbox|prod)_/i', $api_key ) && ! str_starts_with( $api_key, 'npg_' ) ) {
			wp_send_json_error( array( 'message' => __( 'That does not look like a Nisc API key (expected npg_…).', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$client   = new Nisc_PG_Api_Client( $api_key );
		$webhook  = Nisc_PG_Webhook_Controller::get_webhook_url();
		$response = $client->register_webhook( $webhook );

		if ( ! $response['ok'] ) {
			$message = $response['error']['message'] ?? __( 'Connection failed.', 'nisc-payment-gateway-for-woocommerce' );
			wp_send_json_error(
				array(
					'message' => $message,
					'code'    => $response['error']['code'] ?? 'API_ERROR',
				)
			);
		}

		$data   = $response['data'] ?? array();
		$secret = isset( $data['webhookSecret'] ) ? (string) $data['webhookSecret'] : '';

		if ( '' === $secret ) {
			wp_send_json_error( array( 'message' => __( 'Gateway connected but did not return a webhook secret.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		update_option( 'nisc_pg_webhook_secret', $secret, false );

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$settings['enabled']           = 'yes';
		$settings['api_key']           = $api_key;
		$settings['connected']         = 'yes';
		$settings['merchant_id']       = isset( $data['merchantId'] ) ? (string) $data['merchantId'] : '';
		$settings['merchant_name']     = isset( $data['merchantName'] ) ? (string) $data['merchantName'] : '';
		$settings['environment']       = isset( $data['environment'] ) ? (string) $data['environment'] : '';
		$settings['webhook_url']       = isset( $data['url'] ) ? (string) $data['url'] : $webhook;
		$settings['connected_at']      = isset( $data['registeredAt'] ) ? (string) $data['registeredAt'] : gmdate( 'c' );
		$settings['last_error']        = '';

		update_option( 'woocommerce_nisc_payment_gateway_settings', $settings );

		wp_send_json_success(
			array(
				'message'      => __( 'Connected. Webhook registered automatically.', 'nisc-payment-gateway-for-woocommerce' ),
				'merchantName' => $settings['merchant_name'],
				'environment'  => $settings['environment'],
				'webhookUrl'   => $settings['webhook_url'],
				'connectedAt'  => $settings['connected_at'],
				'maskedKey'    => self::mask_api_key( $api_key ),
			)
		);
	}

	public function ajax_disconnect(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';

		if ( $api_key ) {
			$client = new Nisc_PG_Api_Client( $api_key );
			$client->clear_webhook();
		}

		delete_option( 'nisc_pg_webhook_secret' );

		if ( is_array( $settings ) ) {
			$settings['connected']     = 'no';
			$settings['api_key']       = '';
			$settings['merchant_id']   = '';
			$settings['merchant_name'] = '';
			$settings['environment']   = '';
			$settings['webhook_url']   = '';
			$settings['connected_at']  = '';
			$settings['last_error']    = '';
			$settings['enabled']       = 'no';
			update_option( 'woocommerce_nisc_payment_gateway_settings', $settings );
		}

		wp_send_json_success( array( 'message' => __( 'Disconnected.', 'nisc-payment-gateway-for-woocommerce' ) ) );
	}

	public function ajax_refresh_status(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';

		if ( ! $api_key ) {
			wp_send_json_error( array( 'message' => __( 'Not connected.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$client   = new Nisc_PG_Api_Client( $api_key );
		$response = $client->get_webhook();

		if ( ! $response['ok'] ) {
			wp_send_json_error(
				array(
					'message' => $response['error']['message'] ?? __( 'Status check failed.', 'nisc-payment-gateway-for-woocommerce' ),
				)
			);
		}

		$data = $response['data'] ?? array();
		wp_send_json_success(
			array(
				'registered'   => ! empty( $data['registered'] ),
				'url'          => $data['url'] ?? null,
				'merchantName' => $data['merchantName'] ?? '',
				'environment'  => $data['environment'] ?? '',
				'registeredAt' => $data['registeredAt'] ?? null,
			)
		);
	}

	/**
	 * Full connection diagnostics: gateway reachability + API key + M-Pesa OAuth token.
	 */
	public function ajax_connection_test(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$settings  = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key   = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';
		$connected = is_array( $settings ) && 'yes' === ( $settings['connected'] ?? 'no' );

		// Allow testing with a key typed in the connect field before Connect is clicked.
		$posted_key = isset( $_POST['api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		if ( $posted_key ) {
			$api_key = $posted_key;
		}

		$client = new Nisc_PG_Api_Client( $api_key );

		if ( '' === $api_key ) {
			$health = $client->health();
			if ( $health['ok'] ) {
				wp_send_json_success(
					array(
						'ok'      => false,
						'summary' => __( 'Nisc servers are reachable, but no API key is connected yet. Paste your key and click Connect.', 'nisc-payment-gateway-for-woocommerce' ),
						'checks'  => array(
							array(
								'id'      => 'gateway',
								'label'   => __( 'Nisc gateway reachable', 'nisc-payment-gateway-for-woocommerce' ),
								'status'  => 'pass',
								'message' => __( 'Health endpoint responded OK', 'nisc-payment-gateway-for-woocommerce' ),
							),
							array(
								'id'      => 'apiKey',
								'label'   => __( 'API key', 'nisc-payment-gateway-for-woocommerce' ),
								'status'  => 'fail',
								'message' => __( 'Not connected', 'nisc-payment-gateway-for-woocommerce' ),
							),
							array(
								'id'      => 'mpesaToken',
								'label'   => __( 'M-Pesa OAuth token', 'nisc-payment-gateway-for-woocommerce' ),
								'status'  => 'skip',
								'message' => __( 'Skipped  connect an API key first', 'nisc-payment-gateway-for-woocommerce' ),
							),
						),
					)
				);
			}

			wp_send_json_error(
				array(
					'ok'      => false,
					'message' => $health['error']['message'] ?? __( 'Could not reach Nisc Payment Gateway.', 'nisc-payment-gateway-for-woocommerce' ),
					'summary' => __( 'Could not reach Nisc Payment Gateway from this store.', 'nisc-payment-gateway-for-woocommerce' ),
					'checks'  => array(
						array(
							'id'      => 'gateway',
							'label'   => __( 'Nisc gateway reachable', 'nisc-payment-gateway-for-woocommerce' ),
							'status'  => 'fail',
							'message' => $health['error']['message'] ?? __( 'Unreachable', 'nisc-payment-gateway-for-woocommerce' ),
						),
					),
				)
			);
		}

		$response = $client->test_connection();

		if ( ! $response['ok'] ) {
			wp_send_json_error(
				array(
					'ok'      => false,
					'message' => $response['error']['message'] ?? __( 'Connection test failed.', 'nisc-payment-gateway-for-woocommerce' ),
					'summary' => $response['error']['message'] ?? __( 'Connection test failed.', 'nisc-payment-gateway-for-woocommerce' ),
					'checks'  => array(
						array(
							'id'      => 'gateway',
							'label'   => __( 'Nisc gateway reachable', 'nisc-payment-gateway-for-woocommerce' ),
							'status'  => 'fail',
							'message' => $response['error']['message'] ?? __( 'Request failed', 'nisc-payment-gateway-for-woocommerce' ),
						),
					),
					'connected' => $connected,
				)
			);
		}

		$data = $response['data'] ?? array();
		wp_send_json_success(
			array(
				'ok'                    => ! empty( $data['ok'] ),
				'summary'               => isset( $data['summary'] ) ? (string) $data['summary'] : '',
				'checks'                => isset( $data['checks'] ) && is_array( $data['checks'] ) ? $data['checks'] : array(),
				'merchantName'          => $data['merchantName'] ?? '',
				'environment'           => $data['environment'] ?? '',
				'credentialEnvironment' => $data['credentialEnvironment'] ?? '',
				'durationMs'            => $data['durationMs'] ?? null,
				'checkedAt'             => $data['checkedAt'] ?? gmdate( 'c' ),
			)
		);
	}

	/**
	 * Send a real STK push for connection testing (no WooCommerce order).
	 */
	public function ajax_send_test_stk(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';
		$connected = is_array( $settings ) && 'yes' === ( $settings['connected'] ?? 'no' );

		if ( ! $api_key || ! $connected ) {
			wp_send_json_error( array( 'message' => __( 'Connect with an API key before running a test.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$raw_phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
		$phone     = Nisc_PG_Order_Service::normalize_phone( $raw_phone );
		if ( ! $phone ) {
			wp_send_json_error( array( 'message' => __( 'Enter a valid Kenyan M-Pesa number (e.g. 07XXXXXXXX).', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$amount = isset( $_POST['amount'] ) ? (float) sanitize_text_field( wp_unslash( $_POST['amount'] ) ) : 1.0;
		if ( $amount < 1 ) {
			wp_send_json_error( array( 'message' => __( 'Amount must be at least 1 KES.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$reference_id = 'wp-test-' . wp_generate_password( 10, false, false );
		$client       = new Nisc_PG_Api_Client( $api_key );

		$response = $client->create_payment(
			array(
				'amount'      => $amount,
				'currency'    => 'KES',
				'phoneNumber' => $phone,
				'description' => __( 'WordPress plugin connection test', 'nisc-payment-gateway-for-woocommerce' ),
				'referenceId' => $reference_id,
				'metadata'    => array(
					'test'         => true,
					'wpPluginTest' => true,
					'siteUrl'      => home_url( '/' ),
					'source'       => 'wordpress-admin-test',
				),
			)
		);

		if ( ! $response['ok'] ) {
			wp_send_json_error(
				array(
					'message' => $response['error']['message'] ?? __( 'Could not start test STK push.', 'nisc-payment-gateway-for-woocommerce' ),
					'code'    => $response['error']['code'] ?? 'API_ERROR',
				)
			);
		}

		$data         = $response['data'] ?? array();
		$payment_id   = isset( $data['id'] ) ? (string) $data['id'] : '';
		$checkout_id  = isset( $data['checkoutRequestId'] ) ? (string) $data['checkoutRequestId'] : '';

		if ( '' === $payment_id ) {
			wp_send_json_error( array( 'message' => __( 'Gateway did not return a payment id.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		Nisc_PG_Test_Service::remember_pending_test(
			array(
				'transactionId'     => $payment_id,
				'checkoutRequestId' => $checkout_id,
				'phone'             => $phone,
				'amount'            => $amount,
				'referenceId'       => $reference_id,
			)
		);

		wp_send_json_success(
			array(
				'message'           => __( 'STK push sent. Enter your PIN on the phone, then watch for the webhook below.', 'nisc-payment-gateway-for-woocommerce' ),
				'transactionId'     => $payment_id,
				'checkoutRequestId' => $checkout_id,
				'referenceId'       => $reference_id,
				'phone'             => $phone,
				'amount'            => $amount,
				'status'            => isset( $data['status'] ) ? (string) $data['status'] : 'PENDING',
			)
		);
	}

	/**
	 * Poll payment status + any matching test webhook preview.
	 */
	public function ajax_poll_test(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$transaction_id = isset( $_POST['transaction_id'] ) ? sanitize_text_field( wp_unslash( $_POST['transaction_id'] ) ) : '';
		if ( '' === $transaction_id ) {
			wp_send_json_error( array( 'message' => __( 'Missing transaction id.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';
		if ( ! $api_key ) {
			wp_send_json_error( array( 'message' => __( 'Not connected.', 'nisc-payment-gateway-for-woocommerce' ) ) );
		}

		$client   = new Nisc_PG_Api_Client( $api_key );
		$response = $client->get_payment( $transaction_id );

		$payment_status = null;
		$payment_data   = null;
		if ( $response['ok'] ) {
			$payment_data   = $response['data'] ?? array();
			$payment_status = isset( $payment_data['status'] ) ? strtoupper( (string) $payment_data['status'] ) : null;
		}

		$webhook = Nisc_PG_Test_Service::find_webhook_for_transaction( $transaction_id );

		wp_send_json_success(
			array(
				'transactionId' => $transaction_id,
				'paymentStatus' => $payment_status,
				'payment'       => $payment_data,
				'webhook'       => $webhook,
				'webhooks'      => Nisc_PG_Test_Service::get_webhook_log(),
			)
		);
	}

	public function ajax_get_test_webhooks(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$transaction_id = isset( $_POST['transaction_id'] ) ? sanitize_text_field( wp_unslash( $_POST['transaction_id'] ) ) : '';
		$match          = $transaction_id ? Nisc_PG_Test_Service::find_webhook_for_transaction( $transaction_id ) : null;

		wp_send_json_success(
			array(
				'webhooks' => Nisc_PG_Test_Service::get_webhook_log(),
				'webhook'  => $match,
			)
		);
	}

	public function ajax_clear_test_webhooks(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		Nisc_PG_Test_Service::clear_webhook_log();
		wp_send_json_success( array( 'message' => __( 'Test webhook previews cleared.', 'nisc-payment-gateway-for-woocommerce' ) ) );
	}

	public function ajax_get_webhook_log(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		$log = get_option( 'nisc_pg_webhook_log', array() );
		if ( ! is_array( $log ) ) {
			$log = array();
		}

		$log = array_reverse( $log );

		wp_send_json_success(
			array(
				'log'   => $log,
				'count' => count( $log ),
			)
		);
	}

	public function ajax_clear_webhook_log(): void {
		check_ajax_referer( 'nisc_pg_admin', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'nisc-payment-gateway-for-woocommerce' ) ), 403 );
		}

		delete_option( 'nisc_pg_webhook_log' );
		wp_send_json_success( array( 'message' => __( 'Webhook debug log cleared.', 'nisc-payment-gateway-for-woocommerce' ) ) );
	}

	/**
	 * Register WooCommerce Checkout Blocks support.
	 */
	public function register_blocks_support(): void {
		if ( ! class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
			return;
		}

		require_once NISC_PG_PATH . 'includes/class-nisc-blocks-support.php';

		add_action(
			'woocommerce_blocks_payment_method_type_registration',
			function( $payment_method_registry ) {
				$payment_method_registry->register( new Nisc_PG_Blocks_Support() );
			}
		);
	}

	public function maybe_unregister_webhook_on_deactivate(): void {
		$settings = get_option( 'woocommerce_nisc_payment_gateway_settings', array() );
		$api_key  = is_array( $settings ) ? (string) ( $settings['api_key'] ?? '' ) : '';
		if ( ! $api_key ) {
			return;
		}

		$client = new Nisc_PG_Api_Client( $api_key );
		$client->clear_webhook();
	}

	public static function mask_api_key( string $key ): string {
		$len = strlen( $key );
		if ( $len <= 12 ) {
			return str_repeat( '•', max( 0, $len - 4 ) ) . substr( $key, -4 );
		}
		return substr( $key, 0, 8 ) . str_repeat( '•', 12 ) . substr( $key, -4 );
	}
}
