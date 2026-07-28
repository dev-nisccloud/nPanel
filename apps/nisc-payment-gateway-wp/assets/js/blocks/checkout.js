const { registerPaymentMethod } = window.wc.wcBlocksRegistry;
const { createElement } = window.wp.element;
const { getSetting } = window.wc.wcSettings;

const settings = getSetting('nisc_payment_gateway_data', {});

const Label = () => {
	return createElement(
		'span',
		{ className: 'wc-block-components-payment-method-label' },
		settings.title || 'M-Pesa (Nisc)'
	);
};

const Content = () => {
	return createElement(
		'div',
		{ className: 'nisc-payment-gateway-description' },
		settings.description || ''
	);
};

const NiscPaymentGatewayComponent = {
	name: 'nisc_payment_gateway',
	label: createElement(Label),
	content: createElement(Content),
	edit: createElement(Content),
	canMakePayment: () => true,
	ariaLabel: settings.title || 'M-Pesa (Nisc)',
	supports: {
		features: settings.supports || ['products'],
	},
};

registerPaymentMethod(NiscPaymentGatewayComponent);
