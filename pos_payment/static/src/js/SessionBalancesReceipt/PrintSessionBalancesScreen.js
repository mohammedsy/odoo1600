odoo.define('pos_payment.PrintSessionBalancesScreen', function (require) {
    'use strict';

    const AbstractReceiptScreen = require('point_of_sale.AbstractReceiptScreen');
    const Registries = require('point_of_sale.Registries');
    const { onMounted, onWillUnmount, useRef } = owl;

    const PrintSessionBalancesScreen = (AbstractReceiptScreen) => {
        class PrintSessionBalancesScreen extends AbstractReceiptScreen {
            setup() {
                super.setup();
                this.sessionPaymentsReceipt = useRef('session-payments-receipt');
                onMounted(this.onMounted);
                onWillUnmount(this.onWillUnmount);
            }

            onMounted() {
                this.env.posbus.on('session-balances-button-clicked', this, this.close);
                setTimeout(() => {
                    this._autoPrint()
                }, 50);
            }

            onWillUnmount() {
                this.env.posbus.off('session-balances-button-clicked', this);
            }
            close() {
                const order = this.env.pos.get_order();
                const { name: screenName } = order.get_screen_data();
                this.showScreen(screenName);
            }
            back(){
                this.showScreen('ProductScreen');
            }
            async _autoPrint() {
                if(this.env.pos.config.iface_print_auto) {
                    let result = await this.print();
                    if(result && this.env.pos.config.iface_print_skip_screen)
                        this.showScreen('ProductScreen');
                }
            }
            async print() {
                if (this.env.proxy.printer) {
                    const printResult = await this.env.proxy.printer.print_receipt(this.sessionPaymentsReceipt.el.innerHTML);
                    if (printResult.successful) {
                        return true;
                    } else {
                        await this.showPopup('ErrorPopup', {
                            title: printResult.message.title,
                            body: printResult.message.body,
                        });
                        const { confirmed } = await this.showPopup('ConfirmPopup', {
                            title: printResult.message.title,
                            body: this.env._t('Do you want to print using the web printer?'),
                        });
                        if (confirmed) {
                            // We want to call the _printWeb when the popup is fully gone
                            // from the screen which happens after the next animation frame.
                            await nextFrame();
                            return await this._printWeb();
                        }
                        return false;
                    }
                } else {
                    return await this._printWeb();
                }
            }
        }
        PrintSessionBalancesScreen.template = 'PrintSessionBalancesScreen';
        return PrintSessionBalancesScreen;
    };
    Registries.Component.addByExtending(PrintSessionBalancesScreen, AbstractReceiptScreen);

    return PrintSessionBalancesScreen;
});
