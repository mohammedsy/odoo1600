odoo.define('bi_pos_call_center.TransferOrderButton', function(require){
    
    const PosComponent = require('point_of_sale.PosComponent');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const ProductScreen = require('point_of_sale.ProductScreen');


    class TransferOrderButton extends PosComponent {
        setup() {
            super.setup();
            useListener('click', this.onClick);
        }
        async onClick() {
            var self = this;
            await this.showPopup('CreateTransferOrderPopupWidget');
        }
    }
    TransferOrderButton.template = 'TransferOrderButton';

    ProductScreen.addControlButton({
        component: TransferOrderButton,
        condition: function() {
            return this.env.pos.config.is_call_center;
        },
    });

    Registries.Component.add(TransferOrderButton);
});
