odoo.define('bi_pos_call_center.ReceiveScreenWidget', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require("@web/core/utils/hooks");

    class ReceiveScreenWidget extends PosComponent {
        setup() {
            super.setup();
            this.state = {
                query: null,
                selectedReceiveOrder: this.props.partner,
            };
        }
        back() {
            this.props.resolve({ confirmed: false, payload: false });
            this.trigger('close-temp-screen');
        }
        get receive_orders(){
            let self = this;
            let query = self.state.query;
            if(query){
                query = query.trim();
                query = query.toLowerCase();
            }
            else{
                return this.env.pos.received_orders;
            }
        }
        showDetails(event){
            let self = this;
            let o_id = parseInt(event.id);
            let orders =  self.env.pos.received_orders;
            
            let pos_lines = [];

            for(let n=0; n < orders.length; n++){
                if (orders[n]['id']==o_id){
                    pos_lines.push(orders[n])
                }
            }
            self.showPopup('PosCallOrdersDetail', {
                'order': event, 
                'orderline':pos_lines,
            });
        }
    }


    ReceiveScreenWidget.template = 'ReceiveScreenWidget';
    Registries.Component.add(ReceiveScreenWidget);
    return ReceiveScreenWidget;

});
