odoo.define('bi_pos_call_center.PosCallOrdersDetail', function(require) {
	'use strict';

	const PosComponent = require('point_of_sale.PosComponent');
	const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
	const Registries = require('point_of_sale.Registries');
    const { useListener } = require("@web/core/utils/hooks");
    var core = require('web.core');
    var _t = core._t;

	class PosCallOrdersDetail extends AbstractAwaitablePopup {
        setup() {
            super.setup();
            useListener('deliver-order', this.deliver_order);

        }
		go_back_screen() {
			this.showScreen('ProductScreen');
			this.env.posbus.trigger('close-popup', {
                popupId: this.props.id,
                response: { confirmed: false, payload: null },
            });
		}
		GetFormattedDate(date) {
            var month = ("0" + (date.getMonth() + 1)).slice(-2);
            var day  = ("0" + (date.getDate())).slice(-2);
            var year = date.getFullYear();
            var hour =  ("0" + (date.getHours())).slice(-2);
            var min =  ("0" + (date.getMinutes())).slice(-2);
            var seg = ("0" + (date.getSeconds())).slice(-2);
            return year + "-" + month + "-" + day + " " + hour + ":" +  min + ":" + seg;
        }

        get_order_date(dt){
            let a=dt.split("T");   
            let a1=a[0]+'T';
            let a2=a[1]+'Z';
            let final_date=a1+a2;
            let date = new Date(final_date);
            let new_date = this.GetFormattedDate(date);
            return new_date
        }
        transfer_order(event){
        	var self=this;
        	var id = parseInt($(event.target).data('id'));
            var call_order_id = parseInt($(".transfer_call_order").val());
            if(call_order_id == 0){
              alert("Please Select Caller");
            }
            else{
                self.rpc({
                  model: 'pos.call.order',
                  method: 'transfer_order',
                  args: [id,call_order_id],
                }).then(function (order_data) {
                    var orders = self.env.pos.received_orders;
                    for(var a=0;a<orders.length;a++){
                        if(orders[a].id == id){
                            self.env.pos.received_orders.splice(a, 1);
                            break;
                        }
                    }
                    self.render();
                    self.cancel();
                    self.trigger('close-temp-screen');
                    self.showScreen('ProductScreen');
                });
            }

        }
        deliver_order(event){
        	var self=this;
            var order_id=event.detail;
            var order = self.env.pos.get_order();
            var orderlines = order.get_orderlines();
            if(orderlines.length == 0){
                self.rpc({
                model: 'pos.call.order',
                method: 'order_deliver',
                args: [order_id],
                }).then(function(order_data){
                    var receive_order = self.env.pos.received_orders;
                    for(var j=0;j<receive_order.length;j++){
                        if(receive_order[j].id == order_id){
                            self.env.pos.received_orders.splice(j, 1);
                            break;
                        }
                    }
                    var order = self.env.pos.get_order();
                    var orderlines = order.get_orderlines();
                    if(orderlines.length == 0){
                        self.rpc({
                            model: 'pos.call.order',
                            method: 'get_pos_order',
                            args: [order_id],
                        }).then(function(result){
                            order.partner=undefined;
                            order.call_order_id = result['name'];
                            order.call_id = order_id;
                            if(result['partner_id']){
                                order.set_partner(self.env.pos.db.get_partner_by_id(result['partner_id']));
                            }
                            var order_data = result['orderline'];
                            for(var i=0;i<order_data.length;i++){
                                var product = self.env.pos.db.get_product_by_id(order_data[i]['product_id'][0]);
                                order.add_product(product,{'quantity':order_data[i]['qty'],'discount':order_data[i]['discount']});
                            }
                            self.cancel();
                            self.trigger('close-temp-screen');
                            self.showScreen('ProductScreen');
                        });
                    }
                    else{

                        alert(_t('Please remove all products from cart and try again.'));
                    }
                });
            }
            else{
                alert(_t('Please remove all products from cart and try again.'));

            }

        }
	}
	
	PosCallOrdersDetail.template = 'PosCallOrdersDetail';
	Registries.Component.add(PosCallOrdersDetail);
	return PosCallOrdersDetail;
});
