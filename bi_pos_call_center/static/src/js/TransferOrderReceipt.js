odoo.define('bi_pos_call_center.TransferOrderReceipt', function(require){
    
    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');

    const TransferOrderReceipt = (ReceiptScreen) => {
        class TransferOrderReceipt extends ReceiptScreen {
            confirm() {
                var order = this.env.pos.get_order();
                while(order.get_orderlines().length > 0){
                    var line = order.get_selected_orderline();
                    order.remove_orderline(line);
                }
                order.set_partner(null);
                this.props.resolve({ confirmed: true, payload: null });
                this.trigger('close-temp-screen');
            }
        }
        TransferOrderReceipt.template = 'TransferOrderReceipt';
        return TransferOrderReceipt;
    };

    Registries.Component.addByExtending(TransferOrderReceipt, ReceiptScreen); 
   
});
