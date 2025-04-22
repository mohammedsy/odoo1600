odoo.define('pos_payment.chrome', function (require) {
    'use strict';

    const Chrome = require('point_of_sale.Chrome');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require("@web/core/utils/hooks");
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');

    const PosPaymentChrome = (Chrome) =>
        class extends Chrome {
            /**
             * @override
             */
            setup(){
                super.setup();
                useListener('update-payment-count', this._updatePaymentsCount);
                this.state.paymentsCount = 0
            }
            /**
             * @override
             */
            async start() {
                await super.start();
                await this._updatePaymentsCount()
            }
            /**
             * @override
             */
            __showScreen({ detail: { name, props = {} } }) {
                const component = this.constructor.components[name];
                // 1. Set the information of the screen to display.
                this.mainScreen.name = name;
                this.mainScreen.component = component;
                this.mainScreenProps = props;

                // 2. Save the screen to the order.
                //  - This screen is shown when the order is selected.
                if (!(component.prototype instanceof IndependentToOrderScreen) && name !== "ReprintReceiptScreen" && name !== "PrintPaymentScreen" && name !== "PrintSessionBalancesScreen") {
                    this._setScreenData(name, props);
                }
            }

            get isPaymentsScreenShown() {
                return this.mainScreen.name === 'PaymentsScreen';
            }
            get isPrintSessionBalancesScreenShown() {
                return this.mainScreen.name === 'PrintSessionBalancesScreen';
            }

            async _updatePaymentsCount() {
                const domain = [['pos_session_id', '=', this.env.pos.pos_session.id]];
                const { totalCount } = await this.env.services.rpc({
                    model: 'account.payment',
                    method: 'search_from_ui',
                    kwargs: { domain  },
                    context: this.env.session.user_context,
                });
                this.state.paymentsCount = totalCount;
            }
        };

    Registries.Component.extend(Chrome, PosPaymentChrome);

    return Chrome;
});
