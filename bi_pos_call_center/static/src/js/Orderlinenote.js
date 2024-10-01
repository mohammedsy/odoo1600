odoo.define('bi_pos_call_center.OrderlineNote', function(require){
    
    const PosComponent = require('point_of_sale.PosComponent');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const { onMounted, onWillUnmount, useRef, useState } = owl;
    const ProductScreen = require('point_of_sale.ProductScreen');

    class OrderlineNote extends PosComponent {
        setup() {
            super.setup();
            useListener('click', this.onClick);
        }
        get selectedOrderline() {
            return this.env.pos.get_order().get_selected_orderline();
        }
        async onClick() {
            if (!this.selectedOrderline) return;
            const { confirmed, payload: inputNote } = await this.showPopup('OrderlineNotePopupWidget', {
                lineValue: this.selectedOrderline.get_line_note(),
                title: this.env._t('Add Note in Orderline'),
                order_line_note:this.env.pos.order_line_note,
            });

            if (confirmed) {
                this.selectedOrderline.set_line_note(inputNote);
            }
        }
    }
    OrderlineNote.template = 'OrderlineNote';

    ProductScreen.addControlButton({
        component: OrderlineNote,
        condition: function() {
            return this.env.pos.config.is_call_center;
        },
    });

    Registries.Component.add(OrderlineNote);
   
});
