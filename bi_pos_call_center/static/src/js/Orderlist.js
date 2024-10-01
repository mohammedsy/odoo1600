odoo.define('bi_pos_call_center.Orderlist', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const ProductScreen = require('point_of_sale.ProductScreen');
	const { useListener } = require("@web/core/utils/hooks");
	const Registries = require('point_of_sale.Registries');

	class Orderlist extends PosComponent {
		setup() {
            super.setup();
            useListener('click', this.onClick);
        }
		async onClick() {
            var self = this;
            var config_id = self.env.pos.config.id

            self.rpc({
              	model: 'pos.call.order',
              	method: 'get_transfer_orders',
              	args: [config_id],
                }).then(function (call_order_data) {
                     self.env.pos.call_orders = [];
                     var order_data = call_order_data['data']
                     for(var i=0;i<order_data.length;i++){
                        self.env.pos.call_orders.push(order_data[i][0]);
                     }
                     self.showTempScreen('OrdersScreen')
                });
       	}
	}
	Orderlist.template = 'Orderlist';

	ProductScreen.addControlButton({
		component: Orderlist,
		condition: function() {
			return this.env.pos.config.is_call_center;
		},
	});

	Registries.Component.add(Orderlist);

	return Orderlist;
});
