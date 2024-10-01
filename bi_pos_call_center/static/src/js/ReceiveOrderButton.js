odoo.define('bi_pos_call_center.ReceiveOrderButton', function(require){
    
    const PosComponent = require('point_of_sale.PosComponent');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const ProductScreen = require('point_of_sale.ProductScreen');


    class ReceiveOrderButton extends PosComponent {
        setup() {
            super.setup();
            useListener('click', this.onClick);
        }
        async onClick() {
            var self = this;
            var config_id = self.env.pos.config.id
            self.rpc({
                model: 'pos.call.order',
                method: 'get_call_orders',
                args: [config_id],
                }).then(function (order_data) {
                    self.env.pos.received_orders = [];
                    var rec_data = order_data['data']
                    for(var k=0;k<rec_data.length;k++){
                        self.env.pos.received_orders.push(rec_data[k]);
                    }
                    self.showTempScreen('ReceiveScreenWidget');
                });
        }
        
    }
    ReceiveOrderButton.template = 'ReceiveOrderButton';

    ProductScreen.addControlButton({
        component: ReceiveOrderButton,
        condition: function() {
            return this.env.pos.config.is_branch;
        },
    });

    Registries.Component.add(ReceiveOrderButton);
});
