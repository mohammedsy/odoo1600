odoo.define('bi_pos_call_center.OrderlineNotePopupWidget', function(require){
    
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const { onMounted, onWillUnmount, useRef, useState } = owl;

    class OrderlineNotePopupWidget extends AbstractAwaitablePopup {
        setup() {
            super.setup();
            this.state = useState({ inputValue: this.props.lineValue });
            this.inputRef = useRef('input');
            onMounted(() => {
                this.inputRef.el.focus();
            });
        }
        getPayload() {
            return this.state.inputValue;
        }
        line_button(event){
            const value = event.target.innerHTML;
            this.state.inputValue += (" "+value)  
        }
    }
    OrderlineNotePopupWidget.template = 'OrderlineNotePopupWidget';
    Registries.Component.add(OrderlineNotePopupWidget);
   
});
