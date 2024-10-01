odoo.define('bi_pos_call_center.ReceiveOrderPrint', function (require) {
	'use strict';

	const ReceiptScreen = require('point_of_sale.ReceiptScreen');
	const Registries = require('point_of_sale.Registries');

	const ReceiveOrderPrint = (ReceiptScreen) => {
		class ReceiveOrderPrint extends ReceiptScreen {
			setup() {
	            super.setup();
	        }
			back() {
				this.props.resolve({ confirmed: true, payload: null });
				this.trigger('close-temp-screen');
			}
		}
		ReceiveOrderPrint.template = 'ReceiveOrderPrint';
		return ReceiveOrderPrint;
	};

	Registries.Component.addByExtending(ReceiveOrderPrint, ReceiptScreen);

	return ReceiveOrderPrint;
});
