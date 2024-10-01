odoo.define('bi_pos_reprint_reorder.ReceiveOrderReceipt', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class ReceiveOrderReceipt extends PosComponent {
		setup() {
            super.setup();
        }
	}
	ReceiveOrderReceipt.template = 'ReceiveOrderReceipt';

	Registries.Component.add(ReceiveOrderReceipt);

	return ReceiveOrderReceipt;
});
