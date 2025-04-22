odoo.define('point_of_sale.PrintPaymentScreen', function (require) {
    'use strict';

    const AbstractReceiptScreen = require('point_of_sale.AbstractReceiptScreen');
    const Registries = require('point_of_sale.Registries');
    const { onMounted, useRef } = owl;

    const PrintPaymentScreen = (AbstractReceiptScreen) => {
        class PrintPaymentScreen extends AbstractReceiptScreen {
            setup() {
                super.setup();
                this.paymentReceipt = useRef('payment-receipt');
                onMounted(() => {
                    setTimeout(() => this._autoPrintPayment())
                }, 50);
            }
            confirm() {
                this.back()
            }
            back(){
                this.showScreen('PaymentsScreen', { reuseSavedUIState: true });
            }
            async _autoPrintPayment() {
                if(this.env.pos.config.iface_print_auto) {
                    let result = await this.printPayment();
                    if(result && this.env.pos.config.iface_print_skip_screen)
                        this.back();
                }
            }
            async printPayment() {
                if (this.env.proxy.printer) {
                    const printResult = await this.env.proxy.printer.print_receipt(this.paymentReceipt.el.innerHTML);
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
        PrintPaymentScreen.template = 'PrintPaymentScreen';
        return PrintPaymentScreen;
    };
    Registries.Component.addByExtending(PrintPaymentScreen, AbstractReceiptScreen);

    return PrintPaymentScreen;
});
