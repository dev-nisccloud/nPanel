(function ($) {
	'use strict';

	var pollTimer = null;
	var pollStartedAt = 0;
	var activeTransactionId = null;
	var POLL_INTERVAL_MS = 2000;
	var POLL_MAX_MS = 90000;

	function setAlert($el, type, message) {
		if (!$el.length) return;
		$el
			.removeClass('is-error is-success is-info')
			.addClass(type === 'error' ? 'is-error' : type === 'info' ? 'is-info' : 'is-success')
			.text(message)
			.prop('hidden', false);
	}

	function clearAlert($el) {
		$el.prop('hidden', true).text('').removeClass('is-error is-success is-info');
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
		$('#nisc-pg-test-panel').prop('hidden', false);
		if (payload.maskedKey) $('#nisc-pg-masked-key').html('<code>' + payload.maskedKey + '</code>');
		if (payload.webhookUrl) $('#nisc-pg-webhook-url').text(payload.webhookUrl);
		if (payload.connectedAt) $('#nisc-pg-connected-at').text(payload.connectedAt);
		$('.nisc-pg-steps__item').eq(1).removeClass('is-current').addClass('is-done');
		$('.nisc-pg-steps__item').eq(2).addClass('is-done');
	}

	function setDisconnectedUI() {
		stopPolling();
		var $panel = $('#nisc-pg-connection-panel');
		$panel.removeClass('is-connected').addClass('is-disconnected');
		$panel.find('.nisc-pg-status-label').text('Not connected');
		$('#nisc-pg-status-meta').text('Paste your API key to connect this store.');
		$('#nisc-pg-connect-form').prop('hidden', false);
		$('#nisc-pg-connected-view').prop('hidden', true);
		$('#nisc-pg-test-panel').prop('hidden', true);
		$('#nisc-pg-api-key-input').val('');
		$('.nisc-pg-steps__item').eq(1).removeClass('is-done').addClass('is-current');
		$('.nisc-pg-steps__item').eq(2).removeClass('is-done');
		resetTestStatus();
	}

	function stopPolling() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	function resetTestStatus() {
		activeTransactionId = null;
		$('#nisc-pg-test-status').prop('hidden', true);
		$('#nisc-pg-test-status-title').text('Waiting…');
		$('#nisc-pg-test-status-meta').text('');
		$('#nisc-pg-test-status-pill').text('PENDING').attr('data-status', 'pending');
		setFlowStep('stk', 'pending');
		setFlowStep('pin', 'pending');
		setFlowStep('webhook', 'pending');
		$('#nisc-pg-test-status').removeClass('is-done is-failed is-cancelled');
	}

	function setFlowStep(step, state) {
		var $li = $('#nisc-pg-test-flow-steps [data-step="' + step + '"]');
		$li.removeClass('is-pending is-active is-done is-failed').addClass('is-' + state);
	}

	function showTestStatus(title, meta, pill, tone) {
		$('#nisc-pg-test-status').prop('hidden', false);
		$('#nisc-pg-test-status-title').text(title);
		$('#nisc-pg-test-status-meta').text(meta || '');
		$('#nisc-pg-test-status-pill').text(pill).attr('data-status', (pill || '').toLowerCase());
		$('#nisc-pg-test-status')
			.removeClass('is-done is-failed is-cancelled')
			.addClass(tone ? 'is-' + tone : '');
	}

	function escapeHtml(str) {
		return String(str == null ? '' : str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function renderWebhookList(webhooks) {
		var $list = $('#nisc-pg-test-webhook-list');
		var $empty = $('#nisc-pg-test-webhook-empty');
		var items = Array.isArray(webhooks) ? webhooks : [];

		if (!items.length) {
			$list.prop('hidden', true).empty();
			$empty.prop('hidden', false).text(niscPgAdmin.i18n.noWebhooksYet);
			return;
		}

		$empty.prop('hidden', true);
		$list.prop('hidden', false).empty();

		items.forEach(function (entry, index) {
			var status = (entry.paymentStatus || 'UNKNOWN').toUpperCase();
			var receivedAt = entry.receivedAt || '';
			var payloadJson = '';
			try {
				payloadJson = JSON.stringify(entry.payload || entry, null, 2);
			} catch (e) {
				payloadJson = String(entry.payload || '');
			}

			var $card = $(
				'<article class="nisc-pg-test__webhook-card" data-id="' +
					escapeHtml(entry.id || '') +
					'">' +
					'<header>' +
					'<div>' +
					'<strong>' +
					escapeHtml(entry.event || 'payment.completed') +
					'</strong>' +
					'<span class="nisc-pg-help">' +
					escapeHtml(receivedAt) +
					(entry.transactionId ? ' · ' + escapeHtml(entry.transactionId) : '') +
					'</span>' +
					'</div>' +
					'<div class="nisc-pg-test__webhook-badges">' +
					'<span class="nisc-pg-test__pill" data-status="' +
					escapeHtml(status.toLowerCase()) +
					'">' +
					escapeHtml(status) +
					'</span>' +
					'<span class="nisc-pg-badge nisc-pg-badge--muted">No order update</span>' +
					'</div>' +
					'</header>' +
					'<details' +
					(index === 0 ? ' open' : '') +
					'>' +
					'<summary>View JSON payload</summary>' +
					'<pre class="nisc-pg-test__json"><code></code></pre>' +
					'</details>' +
					'</article>'
			);

			$card.find('code').text(payloadJson);
			$list.append($card);
		});
	}

	function finishTest(kind, message, webhook) {
		stopPolling();
		$('#nisc-pg-send-test-stk').prop('disabled', false).text(niscPgAdmin.i18n.sendTestStk);

		if (kind === 'success') {
			setFlowStep('pin', 'done');
			setFlowStep('webhook', 'done');
			showTestStatus(niscPgAdmin.i18n.testSuccess, message, 'SUCCESS', 'done');
			setAlert($('#nisc-pg-test-alert'), 'success', niscPgAdmin.i18n.testSuccess);
		} else if (kind === 'cancelled') {
			setFlowStep('pin', 'done');
			setFlowStep('webhook', webhook ? 'done' : 'active');
			showTestStatus(niscPgAdmin.i18n.testCancelled, message, 'CANCELLED', 'cancelled');
			setAlert($('#nisc-pg-test-alert'), 'info', niscPgAdmin.i18n.testCancelled);
		} else if (kind === 'failed') {
			setFlowStep('pin', 'failed');
			setFlowStep('webhook', webhook ? 'done' : 'active');
			showTestStatus(niscPgAdmin.i18n.testFailed, message, 'FAILED', 'failed');
			setAlert($('#nisc-pg-test-alert'), 'error', message || niscPgAdmin.i18n.testFailed);
		} else {
			showTestStatus(niscPgAdmin.i18n.testTimeout, message, 'TIMEOUT', 'failed');
			setAlert($('#nisc-pg-test-alert'), 'error', niscPgAdmin.i18n.testTimeout);
		}
	}

	function applyPollResult(data) {
		var status = (data.paymentStatus || '').toUpperCase();
		var webhook = data.webhook || null;
		var elapsed = Math.floor((Date.now() - pollStartedAt) / 1000);

		if (Array.isArray(data.webhooks)) {
			renderWebhookList(data.webhooks);
		}

		if (webhook) {
			setFlowStep('webhook', 'done');
		} else {
			setFlowStep('webhook', 'active');
		}

		if (status === 'PENDING' || status === 'PROCESSING' || !status) {
			setFlowStep('pin', 'active');
			showTestStatus(
				niscPgAdmin.i18n.waitingPin,
				niscPgAdmin.i18n.stkSent + ' (' + elapsed + 's)' + (webhook ? ' · ' + niscPgAdmin.i18n.webhookReceived : ' · ' + niscPgAdmin.i18n.webhookWaiting),
				status || 'PENDING'
			);
			return false;
		}

		if (status === 'SUCCESS') {
			finishTest('success', webhook ? niscPgAdmin.i18n.webhookReceived : '', webhook);
			return true;
		}

		if (status === 'CANCELLED') {
			finishTest('cancelled', webhook ? niscPgAdmin.i18n.webhookReceived : niscPgAdmin.i18n.webhookWaiting, webhook);
			// Keep polling briefly if webhook has not arrived yet.
			if (!webhook && Date.now() - pollStartedAt < POLL_MAX_MS) {
				return false;
			}
			return true;
		}

		finishTest('failed', (data.payment && data.payment.resultDesc) || niscPgAdmin.i18n.testFailed, webhook);
		if (!webhook && Date.now() - pollStartedAt < POLL_MAX_MS) {
			return false;
		}
		return true;
	}

	function startPolling(transactionId) {
		stopPolling();
		activeTransactionId = transactionId;
		pollStartedAt = Date.now();

		var tick = function () {
			if (!activeTransactionId) return;

			if (Date.now() - pollStartedAt > POLL_MAX_MS) {
				finishTest('timeout');
				return;
			}

			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_poll_test',
				nonce: niscPgAdmin.nonce,
				transaction_id: activeTransactionId
			})
				.done(function (res) {
					if (!res || !res.success) return;
					if (applyPollResult(res.data || {})) {
						stopPolling();
					}
				});
		};

		tick();
		pollTimer = setInterval(tick, POLL_INTERVAL_MS);
	}

	function loadExistingWebhooks() {
		$.post(niscPgAdmin.ajaxUrl, {
			action: 'nisc_pg_get_test_webhooks',
			nonce: niscPgAdmin.nonce
		}).done(function (res) {
			if (res && res.success && res.data) {
				renderWebhookList(res.data.webhooks || []);
			}
		});
	}

	function setConnCard(state, title, summary, checks) {
		var $card = $('#nisc-pg-conn-card');
		$card
			.removeClass('is-idle is-testing is-success is-failure')
			.addClass('is-' + state);
		$('#nisc-pg-conn-card-title').text(title || '');
		$('#nisc-pg-conn-card-summary').text(summary || '');

		var $list = $('#nisc-pg-conn-checks');
		var items = Array.isArray(checks) ? checks : [];
		if (!items.length) {
			$list.prop('hidden', true).empty();
			return;
		}

		$list.prop('hidden', false).empty();
		items.forEach(function (check) {
			var status = (check.status || 'skip').toLowerCase();
			var mark = status === 'pass' ? '✓' : status === 'fail' ? '!' : '–';
			var $li = $(
				'<li data-status="' +
					escapeHtml(status) +
					'">' +
					'<span class="nisc-pg-conn-checks__mark">' +
					mark +
					'</span>' +
					'<div><strong>' +
					escapeHtml(check.label || check.id || '') +
					'</strong><span>' +
					escapeHtml(check.message || '') +
					'</span></div>' +
					'</li>'
			);
			$list.append($li);
		});
	}

	function applyConnectionTestResult(payload, fromError) {
		var data = payload || {};
		var ok = !!data.ok && !fromError;
		var title = ok
			? niscPgAdmin.i18n.connectionOk
			: niscPgAdmin.i18n.connectionFail;
		var summary =
			data.summary ||
			data.message ||
			(ok ? niscPgAdmin.i18n.connectionOk : niscPgAdmin.i18n.connectionFail);
		if (data.durationMs != null) {
			summary += ' · ' + data.durationMs + 'ms';
		}
		setConnCard(ok ? 'success' : 'failure', title, summary, data.checks || []);
	}

	$(function () {
		if (typeof niscPgAdmin === 'undefined') return;

		if (niscPgAdmin.connected) {
			loadExistingWebhooks();
		}

		$('#nisc-pg-connection-test-btn').on('click', function () {
			var $btn = $(this);
			var apiKey = $.trim($('#nisc-pg-api-key-input').val() || '');
			$btn.prop('disabled', true).text(niscPgAdmin.i18n.connectionTesting);
			setConnCard(
				'testing',
				niscPgAdmin.i18n.connectionTesting,
				'Checking gateway reachability, API key, and M-Pesa OAuth token…',
				[]
			);

			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_connection_test',
				nonce: niscPgAdmin.nonce,
				api_key: apiKey
			})
				.done(function (res) {
					if (!res || !res.success) {
						applyConnectionTestResult((res && res.data) || {}, true);
						return;
					}
					applyConnectionTestResult(res.data || {}, false);
				})
				.fail(function (xhr) {
					var data =
						(xhr.responseJSON && xhr.responseJSON.data) ||
						{ message: niscPgAdmin.i18n.connectionFail };
					applyConnectionTestResult(data, true);
				})
				.always(function () {
					$btn.prop('disabled', false).text(niscPgAdmin.i18n.connectionTest);
				});
		});

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
					loadExistingWebhooks();
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
					$btn.prop('disabled', false).text('Refresh webhook');
				});
		});

		$('#nisc-pg-send-test-stk').on('click', function () {
			var $btn = $(this);
			var $alert = $('#nisc-pg-test-alert');
			var phone = $.trim($('#nisc-pg-test-phone').val() || '');
			var amount = parseFloat($('#nisc-pg-test-amount').val() || '0');

			clearAlert($alert);
			stopPolling();
			resetTestStatus();

			if (!phone) {
				setAlert($alert, 'error', niscPgAdmin.i18n.phoneRequired);
				return;
			}
			if (!amount || amount < 1) {
				setAlert($alert, 'error', niscPgAdmin.i18n.amountInvalid);
				return;
			}

			$btn.prop('disabled', true).text(niscPgAdmin.i18n.sendingStk);
			setFlowStep('stk', 'active');
			showTestStatus(niscPgAdmin.i18n.sendingStk, '', 'INITIATING');

			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_send_test_stk',
				nonce: niscPgAdmin.nonce,
				phone: phone,
				amount: amount
			})
				.done(function (res) {
					if (!res || !res.success) {
						$btn.prop('disabled', false).text(niscPgAdmin.i18n.sendTestStk);
						setFlowStep('stk', 'failed');
						showTestStatus(
							(res && res.data && res.data.message) || 'Could not send STK.',
							'',
							'FAILED',
							'failed'
						);
						setAlert($alert, 'error', (res && res.data && res.data.message) || 'Could not send STK.');
						return;
					}

					var data = res.data || {};
					setFlowStep('stk', 'done');
					setFlowStep('pin', 'active');
					setFlowStep('webhook', 'pending');
					showTestStatus(
						niscPgAdmin.i18n.stkSent,
						(data.phone || phone) + ' · KES ' + (data.amount || amount),
						'PENDING'
					);
					setAlert($alert, 'info', data.message || niscPgAdmin.i18n.stkSent);
					startPolling(data.transactionId);
				})
				.fail(function (xhr) {
					$btn.prop('disabled', false).text(niscPgAdmin.i18n.sendTestStk);
					var msg = 'Could not send STK.';
					if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
						msg = xhr.responseJSON.data.message;
					}
					setFlowStep('stk', 'failed');
					showTestStatus(msg, '', 'FAILED', 'failed');
					setAlert($alert, 'error', msg);
				});
		});

		$('#nisc-pg-clear-test-webhooks').on('click', function () {
			$.post(niscPgAdmin.ajaxUrl, {
				action: 'nisc_pg_clear_test_webhooks',
				nonce: niscPgAdmin.nonce
			}).done(function () {
				renderWebhookList([]);
			});
		});

		$('#nisc-pg-api-key-input').on('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				$('#nisc-pg-connect-btn').trigger('click');
			}
		});

		$('#nisc-pg-test-phone').on('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				$('#nisc-pg-send-test-stk').trigger('click');
			}
		});
	});
})(jQuery);
