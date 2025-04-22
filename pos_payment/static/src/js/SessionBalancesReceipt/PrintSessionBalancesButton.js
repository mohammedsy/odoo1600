odoo.define('pos_payment.PrintSessionBalancesButton', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { onMounted } = owl;
    class PrintSessionBalancesButton extends PosComponent {
        setup() {
            super.setup();
        }

        async onClick() {
            if (this.props.isPrintSessionBalancesScreenShown) {
                this.env.posbus.trigger('session-balances-button-clicked');
            } else {
                const receipt = await this._fetchSessionBalancesData()
                this.showScreen('PrintSessionBalancesScreen', { receipt });
            }
        }

        async _fetchSessionBalancesData() {
            try {
                const session = this.env.pos.pos_session.id;
                const cashier = this.env.pos.cashier ? this.env.pos.cashier.id : false;

                const receiptData = await this.rpc({
                    model: 'pos.session',
                    method: 'export_session_balances_for_ui',
                    args: [session, cashier],
                    context: this.env.session.user_context,
                });
                receiptData.forEach(table => {
                    let tableTotal = table.payments.reduce((sum, payment) => sum + payment.amount, 0);
                    table.total = tableTotal; // Store the total in the table object
                    table.title = this.env._t(table.title);
                });

                // Update the state with the fetched data
                return receiptData;
            } catch (error) {
                console.error('Failed to fetch session balances:', error);
                return [];  // Fallback to an empty array on error
            }
        }


    }
    PrintSessionBalancesButton.template = 'PrintSessionBalancesButton';

    Registries.Component.add(PrintSessionBalancesButton);

    return PrintSessionBalancesButton;
});
