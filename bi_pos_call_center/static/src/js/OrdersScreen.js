odoo.define('bi_pos_call_center.OrdersScreen', function (require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const Registries = require('point_of_sale.Registries');

	class OrdersScreen extends PosComponent {
		setup() {
            super.setup();
            this.state = {
				query: null,
				selectedCallOrder: this.props.client,
			};
        }
		back() {
			this.props.resolve({ confirmed: false, payload: false });
			this.trigger('close-temp-screen');
		}
		get call_orders(){
			let self = this;
			let query = self.state.query;
			if(query){
				query = query.trim();
				query = query.toLowerCase();
			}
			else{
				return this.env.pos.call_orders;
			}
		}		
	}


	OrdersScreen.template = 'OrdersScreen';
	Registries.Component.add(OrdersScreen);
	return OrdersScreen;

});
