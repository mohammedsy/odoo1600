odoo.define('pos_payment.PaymentReceipt', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    const { onWillUpdateProps } = owl;

    class PaymentReceipt extends PosComponent {
        setup() {
            super.setup();
            this._receiptEnv = this.props.payment.getPaymentReceiptEnv();

            onWillUpdateProps((nextProps) => {
                this._receiptEnv = nextProps.payment.getPaymentReceiptEnv();
            });
        }
        get receipt() {
            return this.receiptEnv.receipt;
        }
        get receiptEnv () {
          return this._receiptEnv;
        }
    }
    PaymentReceipt.template = 'PaymentReceipt';

    Registries.Component.add(PaymentReceipt);

    return PaymentReceipt;
});
