(function ($) {
	'use strict';

	function setAlert($el, type, message) {
		if (!$el.length) return;
		$el
			.removeClass('is-error is-success')
			.addClass(type === 'error' ? 'is-error' : 'is-success')
			.text(message)
			.prop('hidden', false);
	}

	function clearAlert($el) {
		$el.prop('hidden', true).text('').removeClass('is-error is-success');
	}

	function setConnectedUI(payload) {
		var $panel = $('#nisc-pg-connection-panel');
		$panel.removeClass('is-disconnected').addClass('is-connected');
		$panel.find('.nisc-pg-status-label').text('Connected');
		var meta = [];
		if (payload.merchantName) meta.push(payload.merchantName);
		if (payload.environment) meta.push(payload.environment);
		$('#nisc-pg-status-meta').text(meta.length ? meta.join(' · ') : 'Ready for checkout');
		$('#nisc-pg-connect-form').prop('hidden', true);
		$('#nisc-pg-connected-view').prop('hidden', false);
		if (payload.maskedKey) $('#nisc-pg-masked-key').html('<code>' + payload.maskedKey + '</code>');
		if (payload.webhookUrl) $('#nisc-pg-webhook-url').text(payload.webhookUrl);
		if (payload.connectedAt) $('#nisc-pg-connected-at').text(payload.connectedAt);
		$('.nisc-pg-steps__item').eq(1).removeClass('is-current').addClass('is-done');
		$('.nisc-pg-steps__item').eq(2).addClass('is-done');
	}

	function setDisconnectedUI() {
		var $panel = $('#nisc-pg-connection-panel');
		$panel.removeClass('is-connected').addClass('is-disconnected');
		$panel.find('.nisc-pg-status-label').text('Not connected');
		$('#nisc-pg-status-meta').text('Paste your API key to connect this store.');
		$('#nisc-pg-connect-form').prop('hidden', false);
		$('#nisc-pg-connected-view').prop('hidden', true);
		$('#nisc-pg-api-key-input').val('');
		$('.nisc-pg-steps__item').eq(1).removeClass('is-done').addClass('is-current');
		$('.nisc-pg-steps__item').eq(2).removeClass('is-done');
	}

	$(function () {
		if (typeof niscPgAdmin === 'undefined') return;

		$('#nisc-pg-connect-btn').on('click', function () {
			var $btn = $(this);
			var $alert = $('#nisc-pg-alert');
			var apiKey = $.trim($('#nisc-pg-api-key-input').val() || '');
			clearAlert($alert);

			if (!apiKey) {
				setAlert($alert, 'error', 'Please paste your API key.');
				return;
			}

			$btn.prop('disabled', true).text(niscPgAdmin.i18n.connecting);

			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_connect',
				nonce: niscPgAdmin.nonce,
				api_key: apiKey
			})
				.done(function (res) {
					if (!res || !res.success) {
						setAlert(
							$alert,
							'error',
							(res && res.data && res.data.message) || niscPgAdmin.i18n.connectFail
						);
						return;
					}
					setConnectedUI(res.data || {});
					setAlert($('#nisc-pg-alert-connected'), 'success', res.data.message || niscPgAdmin.i18n.connectOk);
				})
				.fail(function (xhr) {
					var msg = niscPgAdmin.i18n.connectFail;
					if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
						msg = xhr.responseJSON.data.message;
					}
					setAlert($alert, 'error', msg);
				})
				.always(function () {
					$btn.prop('disabled', false).text('Connect');
				});
		});

		$('#nisc-pg-disconnect-btn').on('click', function () {
			if (!window.confirm('Disconnect this store from Nisc Payment Gateway?')) return;

			var $btn = $(this);
			var $alert = $('#nisc-pg-alert-connected');
			$btn.prop('disabled', true).text(niscPgAdmin.i18n.disconnecting);
			clearAlert($alert);

			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_disconnect',
				nonce: niscPgAdmin.nonce
			})
				.done(function (res) {
					setDisconnectedUI();
					setAlert($('#nisc-pg-alert'), 'success', (res.data && res.data.message) || niscPgAdmin.i18n.disconnected);
				})
				.fail(function () {
					setAlert($alert, 'error', 'Could not disconnect. Try again.');
				})
				.always(function () {
					$btn.prop('disabled', false).text('Disconnect');
				});
		});

		$('#nisc-pg-refresh-btn').on('click', function () {
			var $btn = $(this);
			var $alert = $('#nisc-pg-alert-connected');
			$btn.prop('disabled', true).text(niscPgAdmin.i18n.refreshing);
			clearAlert($alert);

			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_refresh_status',
				nonce: niscPgAdmin.nonce
			})
				.done(function (res) {
					if (!res || !res.success) {
						setAlert($alert, 'error', (res && res.data && res.data.message) || 'Status check failed.');
						return;
					}
					var data = res.data || {};
					if (data.registered) {
						setAlert($alert, 'success', 'Webhook is registered and reachable from the gateway.');
						if (data.url) $('#nisc-pg-webhook-url').text(data.url);
					} else {
						setAlert($alert, 'error', 'API key works, but no webhook is registered. Click Connect again.');
					}
				})
				.fail(function () {
					setAlert($alert, 'error', 'Status check failed.');
				})
				.always(function () {
					$btn.prop('disabled', false).text('Check connection');
				});
		});

		$('#nisc-pg-api-key-input').on('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				$('#nisc-pg-connect-btn').trigger('click');
			}
		});
	});
})(jQuery);
