odoo.define('bi_pos_call_center.CreateTransferOrderPopupWidget', function(require){
    
    const models = require('point_of_sale.models');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const { posbus } = require('point_of_sale.utils');

    class CreateTransferOrderPopupWidget extends AbstractAwaitablePopup {
        setup() {
            super.setup();
        }
        async send_order(){
            var order =this.env.pos.selectedOrder;
            if(order.get_partner() != null){
                order.branch_id = parseInt($(".order_session").val());
                order.priority = parseInt($(".order_priorty").val());
                var send_order_date = new Date(Date.parse($(".send_order_date").val(),"dd/MM/yyyy T HH:mm"));
                if(send_order_date == "Invalid Date" ){
                    alert("Please Define Order Date");                      
                }
                else{
                    order.send_order_date = send_order_date.getFullYear()+"-"+(send_order_date.getMonth()+1)+"-"+send_order_date.getDate()+" "+send_order_date.getHours()+":"+send_order_date.getMinutes()+":"+send_order_date.getSeconds();
                    order.order_note = $(".order_note").val();                
                
                    await this.save_order();
                    this.env.posbus.trigger('close-popup', {
                        popupId: this.props.id,
                        response: { confirmed: false, payload: null },
                    });
                }
                
            }
            else{
                alert("Please select customer first !!!!");
            }
        }
        async print_send_order(){
            var order =this.env.pos.selectedOrder;
            if(order.get_partner() != null){
                order.branch_id = parseInt($(".order_session").val());
                order.priority = parseInt($(".order_priorty").val());
                var send_order_date = new Date(Date.parse($(".send_order_date").val(),"dd/MM/yyyy T HH:mm"));
                if(send_order_date == "Invalid Date" ){
                    alert("Please Define Order Date");                      
                }
                else{
                    order.send_order_date = send_order_date.getFullYear()+"-"+(send_order_date.getMonth()+1)+"-"+send_order_date.getDate()+" "+send_order_date.getHours()+":"+send_order_date.getMinutes()+":"+send_order_date.getSeconds();
                    order.order_note = $(".order_note").val();                
                
                    await this.save_order2();
                    this.env.posbus.trigger('close-popup', {
                        popupId: this.props.id,
                        response: { confirmed: false, payload: null },
                    });
                }
                
            }
            else{
                alert("Please select customer first !!!!");
            }


        }
        save_order2(){
            var self = this;
            var current_order = self.env.pos.get_order();
            var data = current_order.export_as_JSON();

            return self.rpc({
                        model: 'pos.call.order',
                        method: 'create_pos_call_order',
                        args: [data],
            }).then(function (order_data) {
                current_order.order_ref = order_data['result'];
                current_order.call_order_id = order_data['result'][0].name;
                self.showTempScreen('TransferOrderReceipt')
            });

        }
        save_order(){
            var self = this;
            var current_order = self.env.pos.get_order();
            var data = current_order.export_as_JSON();

            return  self.rpc({
                        model: 'pos.call.order',
                        method: 'create_pos_call_order',
                        args: [data],
            }).then(function (order_data) {
                while(current_order.get_orderlines().length > 0){
                    var line = current_order.get_selected_orderline();
                    current_order.remove_orderline(line);
                }
                current_order.set_partner(null);
            });
        }
       
        
    }
    CreateTransferOrderPopupWidget.template = 'CreateTransferOrderPopupWidget';
    Registries.Component.add(CreateTransferOrderPopupWidget);
   
});
