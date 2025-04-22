odoo.define('pos_payment.PaymentPopup', function (require) {
    'use strict';

    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    const { _lt } = require('@web/core/l10n/translation');
    const { parse } = require('web.field_utils');
    const { useValidateCashInput, useAsyncLockedMethod } = require('point_of_sale.custom_hooks');

    const { useRef, useState, onMounted } = owl;

    class PaymentPopup extends AbstractAwaitablePopup {
        setup() {
            super.setup();
            this.state = useState({
                inputAmount: '',
                reference: "",
                partner: false,
                isError: false,
                errorMessage: "",
                parsedAmount: 0,
                paymentMethod: false,
            });
            this.inputAmountRef = useRef('input-amount-ref');
            useValidateCashInput('input-amount-ref');
            this.confirm = useAsyncLockedMethod(this.confirm);
            this.payment_methods_from_config = this.env.pos.payment_methods.filter(method => this.env.pos.config.payment_method_ids.includes(method.id) && method.journal_id !== false);
            onMounted(this.onMounted);

        }
        onMounted(){
            this.inputAmountRef.el.focus(); // Focus the input
        }
        confirm() {
            try {
                parse.float(this.state.inputAmount);
            } catch (_error) {
                this.setError('Invalid amount');
                return;
            }
            if (parse.float(this.state.inputAmount) < 0) {
                this.state.inputAmount = this.state.inputAmount.substring(1);
            }
            if (!this.canConfirm()) return;
            return super.confirm();
        }
        _onAmountKeypress(event) {
            if (event.key === '-') {
                event.preventDefault();
                this.handleInputChange();
            }
        }
       
        getPayload() {
            return {
                payment: this.state.parsedAmount,
                partner: this.state.partner,
                paymentMethod: this.state.paymentMethod,
                reference: this.state.reference.trim(),
            };
        }
        handleInputChange() {
            if (this.inputAmountRef.el.classList.contains('invalid-cash-input')) return;
            this.state.parsedAmount = parse.float(this.state.inputAmount);
            this.resetError()
        }

        canConfirm() {
            if (this.state.inputAmount === "0" || this.state.inputAmount === "") {
                this.setError('Invalid amount');
                return false;
            } else if (this.state.partner === false || this.state.partner === undefined) {
                this.setError('Please select a contact');
                return false;
            } else if (this.state.paymentMethod === false || this.state.paymentMethod === undefined) {
                this.setError('Please select a payment method');
                return false;
            }
            return true;
        }

        // Select Payment Functions
        selectPaymentMethod(paymentMethod) {
            this.state.paymentMethod = paymentMethod
            this.resetError()
        }
        
        resetError() {
            this.state.isError = false;
            this.state.errorMessage = ""
        }
        setError(errorMessage) {
            this.state.isError = true;
            this.state.errorMessage = this.env._t(errorMessage)
        }

        // Select Partner Functions
        set_partner(partner) {
            this.state.partner = partner;
        }
        get isLongName() {
            return this.partner && this.partner.name.length > 10;
        }
        get partner() {
            return this.state.partner;
        }

        async selectPartner() {
            this.el.parentElement.style.zIndex = -1
            const currentPartner = this.partner;
            const { confirmed, payload: newPartner } = await this.showTempScreen(
                'PartnerListScreen',
                { partner: currentPartner }
            );
            this.el.parentElement.style.zIndex = 1000
            if (confirmed) {
                this.set_partner(newPartner);
            }
            this.inputAmountRef.el.focus(); // Focus the input
            this.resetError()
        }
    }
    
    PaymentPopup.template = 'pos_payment.PaymentPopup';
    PaymentPopup.defaultProps = {
        cancelText: _lt('Cancel'),
        title: _lt('Payment'),
    };

    Registries.Component.add(PaymentPopup);

    return PaymentPopup;
});
