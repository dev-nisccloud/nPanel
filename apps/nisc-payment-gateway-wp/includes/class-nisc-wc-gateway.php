<?php
/**
 * WooCommerce payment gateway: Nisc Payment Gateway.
 *
 * @package Nisc_Payment_Gateway
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Nisc_PG_WC_Gateway class.
 */
class Nisc_PG_WC_Gateway extends WC_Payment_Gateway {

	/** @var string */
	public $api_key = '';

	/** @var string */
	public $connected = 'no';

	public function __construct() {
		$this->id                 = 'nisc_payment_gateway';
		$this->method_title       = __( 'Nisc Payment Gateway', 'nisc-payment-gateway' );
		$this->method_description = __( 'Accept M-Pesa STK Push payments via Nisc Cloud. Paste your API key — everything else is automatic.', 'nisc-payment-gateway' );
		$this->has_fields         = true;
		$this->supports           = array( 'products' );
/**
 * Don't set a giant logo as the WC method icon — brand appears on thank-you + settings.
 * Checkout stays clean with title/description only.
 */
		$this->icon = '';

		$this->init_form_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title', __( 'M-Pesa (Nisc)', 'nisc-payment-gateway' ) );
		$this->description = $this->get_option( 'description', __( 'You will receive an M-Pesa prompt on your phone. Enter your PIN to complete payment.', 'nisc-payment-gateway' ) );
		$this->enabled     = $this->get_option( 'enabled', 'no' );
		$this->api_key     = $this->get_option( 'api_key', '' );
		$this->connected   = $this->get_option( 'connected', 'no' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_thankyou_' . $this->id, array( $this, 'thankyou_page' ) );
	}

	public function init_form_fields(): void {
		$this->form_fields = array(
			'enabled'     => array(
				'title'   => __( 'Enable / Disable', 'nisc-payment-gateway' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable Nisc Payment Gateway', 'nisc-payment-gateway' ),
				'default' => 'no',
			),
			'title'       => array(
				'title'       => __( 'Checkout title', 'nisc-payment-gateway' ),
				'type'        => 'text',
				'description' => __( 'Shown to customers at checkout.', 'nisc-payment-gateway' ),
				'default'     => __( 'M-Pesa (Nisc)', 'nisc-payment-gateway' ),
				'desc_tip'    => true,
			),
			'description' => array(
				'title'       => __( 'Checkout description', 'nisc-payment-gateway' ),
				'type'        => 'textarea',
				'description' => __( 'Instructions shown under the payment method.', 'nisc-payment-gateway' ),
				'default'     => __( 'You will receive an M-Pesa prompt on your phone. Enter your PIN to complete payment.', 'nisc-payment-gateway' ),
			),
			'api_key'     => array(
				'title' => __( 'API key', 'nisc-payment-gateway' ),
				'type'  => 'password',
			),
			'connected'   => array(
				'title' => __( 'Connected', 'nisc-payment-gateway' ),
				'type'  => 'text',
			),
		);
	}

	/**
	 * Custom settings screen — guided connect flow.
	 */
	public function admin_options(): void {
		$connected     = 'yes' === $this->get_option( 'connected', 'no' );
		$merchant_name = (string) $this->get_option( 'merchant_name', '' );
		$environment   = (string) $this->get_option( 'environment', '' );
		$webhook_url   = (string) $this->get_option( 'webhook_url', Nisc_PG_Webhook_Controller::get_webhook_url() );
		$connected_at  = (string) $this->get_option( 'connected_at', '' );
		$api_key       = (string) $this->get_option( 'api_key', '' );
		$masked_key    = $api_key ? Nisc_PG_Plugin::mask_api_key( $api_key ) : '';
		$logo_url      = NISC_PG_URL . 'assets/images/nisc-payment-gateway-logo.png';
		$env_label     = $this->friendly_environment( $environment );

		?>
		<div class="nisc-pg-admin">
			<header class="nisc-pg-hero">
				<div class="nisc-pg-hero__brand">
					<img
						src="<?php echo esc_url( $logo_url ); ?>"
						alt="<?php esc_attr_e( 'Nisc Cloud Payment Gateway', 'nisc-payment-gateway' ); ?>"
						class="nisc-pg-hero__logo"
					/>
				</div>
				<div class="nisc-pg-hero__copy">
					<p class="nisc-pg-hero__eyebrow"><?php esc_html_e( 'WooCommerce payment method', 'nisc-payment-gateway' ); ?></p>
					<h2><?php esc_html_e( 'Accept M-Pesa in three steps', 'nisc-payment-gateway' ); ?></h2>
					<p><?php esc_html_e( 'Paste the API key from your nPanel merchant account. We register webhooks for you — no technical setup.', 'nisc-payment-gateway' ); ?></p>
				</div>
			</header>

			<ol class="nisc-pg-steps" aria-label="<?php esc_attr_e( 'Setup steps', 'nisc-payment-gateway' ); ?>">
				<li class="nisc-pg-steps__item is-done">
					<span class="nisc-pg-steps__num">1</span>
					<div>
						<strong><?php esc_html_e( 'Install plugin', 'nisc-payment-gateway' ); ?></strong>
						<span><?php esc_html_e( 'You are here — plugin is active.', 'nisc-payment-gateway' ); ?></span>
					</div>
				</li>
				<li class="nisc-pg-steps__item <?php echo $connected ? 'is-done' : 'is-current'; ?>">
					<span class="nisc-pg-steps__num">2</span>
					<div>
						<strong><?php esc_html_e( 'Connect with API key', 'nisc-payment-gateway' ); ?></strong>
						<span><?php esc_html_e( 'From nPanel → Payment Gateway → your merchant → API keys.', 'nisc-payment-gateway' ); ?></span>
					</div>
				</li>
				<li class="nisc-pg-steps__item <?php echo $connected ? 'is-done' : ''; ?>">
					<span class="nisc-pg-steps__num">3</span>
					<div>
						<strong><?php esc_html_e( 'Enable at checkout', 'nisc-payment-gateway' ); ?></strong>
						<span><?php esc_html_e( 'Turn on the method below and take a test order.', 'nisc-payment-gateway' ); ?></span>
					</div>
				</li>
			</ol>

			<section class="nisc-pg-panel <?php echo $connected ? 'is-connected' : 'is-disconnected'; ?>" id="nisc-pg-connection-panel">
				<div class="nisc-pg-panel__status">
					<span class="nisc-pg-status-dot" aria-hidden="true"></span>
					<div>
						<strong class="nisc-pg-status-label">
							<?php
							echo $connected
								? esc_html__( 'Connected', 'nisc-payment-gateway' )
								: esc_html__( 'Not connected', 'nisc-payment-gateway' );
							?>
						</strong>
						<p class="nisc-pg-status-meta" id="nisc-pg-status-meta">
							<?php
							if ( $connected ) {
								printf(
									/* translators: 1: merchant name, 2: environment label */
									esc_html__( '%1$s · %2$s', 'nisc-payment-gateway' ),
									esc_html( $merchant_name ?: __( 'Merchant', 'nisc-payment-gateway' ) ),
									esc_html( $env_label ?: __( 'Live key from nPanel', 'nisc-payment-gateway' ) )
								);
							} else {
								esc_html_e( 'Paste your API key to connect this store.', 'nisc-payment-gateway' );
							}
							?>
						</p>
					</div>
				</div>

				<div class="nisc-pg-connect" id="nisc-pg-connect-form" <?php echo $connected ? 'hidden' : ''; ?>>
					<label class="nisc-pg-label" for="nisc-pg-api-key-input">
						<?php esc_html_e( 'API key', 'nisc-payment-gateway' ); ?>
					</label>
					<div class="nisc-pg-connect__row">
						<input
							type="password"
							id="nisc-pg-api-key-input"
							class="nisc-pg-input"
							placeholder="npg_…"
							autocomplete="off"
							spellcheck="false"
						/>
						<button type="button" class="button button-primary nisc-pg-btn-primary" id="nisc-pg-connect-btn">
							<?php esc_html_e( 'Connect', 'nisc-payment-gateway' ); ?>
						</button>
					</div>
					<p class="nisc-pg-help">
						<?php esc_html_e( 'Sandbox or production is already set on the key in nPanel — you only need the key here.', 'nisc-payment-gateway' ); ?>
					</p>
					<div class="nisc-pg-alert" id="nisc-pg-alert" hidden role="alert"></div>
				</div>

				<div class="nisc-pg-connected" id="nisc-pg-connected-view" <?php echo $connected ? '' : 'hidden'; ?>>
					<dl class="nisc-pg-facts">
						<div>
							<dt><?php esc_html_e( 'API key', 'nisc-payment-gateway' ); ?></dt>
							<dd id="nisc-pg-masked-key"><code><?php echo esc_html( $masked_key ); ?></code></dd>
						</div>
						<div>
							<dt><?php esc_html_e( 'Webhook', 'nisc-payment-gateway' ); ?></dt>
							<dd>
								<code class="nisc-pg-mono" id="nisc-pg-webhook-url"><?php echo esc_html( $webhook_url ); ?></code>
								<span class="nisc-pg-badge"><?php esc_html_e( 'Auto-registered', 'nisc-payment-gateway' ); ?></span>
							</dd>
						</div>
						<?php if ( $connected_at ) : ?>
						<div>
							<dt><?php esc_html_e( 'Connected', 'nisc-payment-gateway' ); ?></dt>
							<dd id="nisc-pg-connected-at"><?php echo esc_html( $connected_at ); ?></dd>
						</div>
						<?php endif; ?>
					</dl>
					<div class="nisc-pg-connected__actions">
						<button type="button" class="button" id="nisc-pg-refresh-btn">
							<?php esc_html_e( 'Check connection', 'nisc-payment-gateway' ); ?>
						</button>
						<button type="button" class="button nisc-pg-btn-danger" id="nisc-pg-disconnect-btn">
							<?php esc_html_e( 'Disconnect', 'nisc-payment-gateway' ); ?>
						</button>
					</div>
					<div class="nisc-pg-alert" id="nisc-pg-alert-connected" hidden role="status"></div>
				</div>
			</section>

			<section class="nisc-pg-panel nisc-pg-panel--settings">
				<h3><?php esc_html_e( 'Checkout display', 'nisc-payment-gateway' ); ?></h3>
				<p class="nisc-pg-help"><?php esc_html_e( 'These labels are what shoppers see. Connection above is required before payments will work.', 'nisc-payment-gateway' ); ?></p>
				<table class="form-table">
					<?php $this->generate_settings_html( array( 'enabled', 'title', 'description' ) ); ?>
				</table>
			</section>
		</div>
		<?php
	}

	/**
	 * Persist only the display fields via WC save; connection uses AJAX.
	 */
	public function process_admin_options(): bool {
		$post_data = $this->get_post_data();

		foreach ( array( 'enabled', 'title', 'description' ) as $key ) {
			if ( isset( $post_data[ 'woocommerce_' . $this->id . '_' . $key ] ) ) {
				$value = $this->get_field_value( $key, $this->form_fields[ $key ], $post_data );
				$this->settings[ $key ] = $this->validate_field( $key, $value );
			} elseif ( 'enabled' === $key ) {
				$this->settings['enabled'] = 'no';
			}
		}

		return update_option( $this->get_option_key(), $this->settings, 'yes' );
	}

	public function is_available(): bool {
		if ( 'yes' !== $this->enabled ) {
			return false;
		}
		if ( 'yes' !== $this->get_option( 'connected', 'no' ) ) {
			return false;
		}
		if ( ! $this->get_option( 'api_key' ) ) {
			return false;
		}
		return parent::is_available();
	}

	public function payment_fields(): void {
		if ( $this->description ) {
			echo wp_kses_post( wpautop( wptexturize( $this->description ) ) );
		}

		$phone = '';
		if ( WC()->customer ) {
			$phone = (string) WC()->customer->get_billing_phone();
		}

		woocommerce_form_field(
			'nisc_pg_phone',
			array(
				'type'        => 'tel',
				'label'       => __( 'M-Pesa phone number', 'nisc-payment-gateway' ),
				'required'    => true,
				'placeholder' => '07XXXXXXXX',
				'class'       => array( 'form-row-wide' ),
				'custom_attributes' => array(
					'autocomplete' => 'tel',
					'inputmode'    => 'tel',
				),
			),
			$phone
		);

		echo '<p class="nisc-pg-checkout-hint">' . esc_html__( 'Use the Safaricom number that will receive the STK prompt.', 'nisc-payment-gateway' ) . '</p>';
	}

	/**
	 * @param int $order_id Order ID.
	 * @return array<string,string>
	 */
	public function process_payment( $order_id ): array {
		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			wc_add_notice( __( 'Order not found.', 'nisc-payment-gateway' ), 'error' );
			return array( 'result' => 'failure' );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- checkout nonce handled by WC.
		$raw_phone = isset( $_POST['nisc_pg_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['nisc_pg_phone'] ) ) : $order->get_billing_phone();
		$phone     = Nisc_PG_Order_Service::normalize_phone( (string) $raw_phone );

		if ( ! $phone ) {
			wc_add_notice( __( 'Enter a valid Kenyan M-Pesa number (e.g. 07XXXXXXXX).', 'nisc-payment-gateway' ), 'error' );
			return array( 'result' => 'failure' );
		}

		$api_key = (string) $this->get_option( 'api_key', '' );
		$client  = new Nisc_PG_Api_Client( $api_key );

		$amount = (float) $order->get_total();
		if ( $amount <= 0 ) {
			wc_add_notice( __( 'Order total must be greater than zero.', 'nisc-payment-gateway' ), 'error' );
			return array( 'result' => 'failure' );
		}

		$response = $client->create_payment(
			array(
				'amount'      => $amount,
				'currency'    => $order->get_currency() ?: 'KES',
				'phoneNumber' => $phone,
				'description' => sprintf(
					/* translators: %s: order number */
					__( 'Order %s', 'nisc-payment-gateway' ),
					$order->get_order_number()
				),
				'referenceId' => (string) $order->get_id(),
				'metadata'    => array(
					'orderId'     => $order->get_id(),
					'orderNumber' => $order->get_order_number(),
					'siteUrl'     => home_url( '/' ),
				),
			)
		);

		if ( ! $response['ok'] ) {
			$message = $response['error']['message'] ?? __( 'Could not start M-Pesa payment.', 'nisc-payment-gateway' );
			wc_add_notice( $message, 'error' );
			$order->add_order_note( 'Nisc PG error: ' . $message );
			return array( 'result' => 'failure' );
		}

		$data = $response['data'] ?? array();
		$payment_id = isset( $data['id'] ) ? (string) $data['id'] : '';
		$checkout_id = isset( $data['checkoutRequestId'] ) ? (string) $data['checkoutRequestId'] : '';

		$order->update_meta_data( Nisc_PG_Order_Service::META_PAYMENT_ID, $payment_id );
		$order->update_meta_data( Nisc_PG_Order_Service::META_CHECKOUT_ID, $checkout_id );
		$order->update_meta_data( Nisc_PG_Order_Service::META_PHONE, $phone );
		$order->update_status(
			'on-hold',
			__( 'Nisc Payment Gateway: STK push sent. Waiting for customer to enter M-Pesa PIN.', 'nisc-payment-gateway' )
		);
		$order->save();

		WC()->cart->empty_cart();

		return array(
			'result'   => 'success',
			'redirect' => $this->get_return_url( $order ),
		);
	}

	/**
	 * @param int $order_id Order ID.
	 */
	public function thankyou_page( $order_id ): void {
		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		if ( $order->get_payment_method() !== $this->id ) {
			return;
		}

		if ( $order->is_paid() ) {
			echo '<div class="nisc-pg-thankyou is-paid"><p><strong>' . esc_html__( 'Payment received. Thank you!', 'nisc-payment-gateway' ) . '</strong></p></div>';
			return;
		}

		$phone = (string) $order->get_meta( Nisc_PG_Order_Service::META_PHONE );
		?>
		<div class="nisc-pg-thankyou">
			<div class="nisc-pg-thankyou__card">
				<img
					src="<?php echo esc_url( NISC_PG_URL . 'assets/images/nisc-payment-gateway-logo.png' ); ?>"
					alt=""
					class="nisc-pg-thankyou__logo"
				/>
				<h3><?php esc_html_e( 'Check your phone', 'nisc-payment-gateway' ); ?></h3>
				<p>
					<?php
					if ( $phone ) {
						printf(
							/* translators: %s: phone number */
							esc_html__( 'We sent an M-Pesa prompt to %s. Enter your PIN to finish paying.', 'nisc-payment-gateway' ),
							esc_html( $phone )
						);
					} else {
						esc_html_e( 'We sent an M-Pesa prompt to your phone. Enter your PIN to finish paying.', 'nisc-payment-gateway' );
					}
					?>
				</p>
				<p class="nisc-pg-thankyou__hint"><?php esc_html_e( 'This page updates when payment is confirmed. You can also close it — we will email you when the order is paid.', 'nisc-payment-gateway' ); ?></p>
			</div>
		</div>
		<?php
	}

	private function friendly_environment( string $environment ): string {
		$env = strtoupper( $environment );
		if ( in_array( $env, array( 'SANDBOX', 'TEST' ), true ) ) {
			return __( 'Sandbox', 'nisc-payment-gateway' );
		}
		if ( in_array( $env, array( 'PRODUCTION', 'LIVE', 'PROD' ), true ) ) {
			return __( 'Production', 'nisc-payment-gateway' );
		}
		return $environment;
	}
}
