odoo.define('pos_payment.HeaderPaymentsButton', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useState, onMounted } = owl;
    class HeaderPaymentsButton extends PosComponent {
        setup() {
            super.setup();
            this.state = useState({
                paymentsCount: this.env.pos.paymentsCount,
            });
        }

        onClick() {
            if (this.props.isPaymentsScreenShown) {
                this.env.posbus.trigger('payment-button-clicked');
            } else {
                this.showScreen('PaymentsScreen', { ui: { filter: "SESSION" }, });            
            }
        }
    }
    HeaderPaymentsButton.template = 'HeaderPaymentsButton';

    Registries.Component.add(HeaderPaymentsButton);

    return HeaderPaymentsButton;
});
