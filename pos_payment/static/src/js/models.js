odoo.define('pos_payment.models', function (require) {
    "use strict";

    var config = require('web.config');
    var core = require('web.core');
    var field_utils = require('web.field_utils');
    var _t = core._t;

    var QWeb = core.qweb;
    var { PosGlobalState } = require('point_of_sale.models');

    const Registries = require('point_of_sale.Registries');

    const PosPaymentGlobalState = (PosGlobalState) => class PosPaymentGlobalState extends PosGlobalState {
        constructor(obj) {
            super(obj);
            this.PAYMENT_SCREEN_STATE = {
                syncedPayments: {
                    currentPage: 1,
                    cache: {},
                    toShow: [],
                    nPerPage: 50,
                    totalCount: null,
                },
                ui: {
                    selectedPaymentId: null,
                    searchDetails: this.getPayDefaultSearchDetails(),
                    filter: null,
                },
            };
            this.payments = []
        }

        async registerPaymentToBackend(payload){
            const { payment, partner, paymentMethod, reference } = payload;
            const { paymentId, paymentName, ok } = await this.env.services.rpc({
                model: 'account.payment',
                method: 'create_from_ui',
                args: [{
                    'company_id': this.company.id,
                    'pos_session_id': this.pos_session.id,
                    'pos_payment_method_id': paymentMethod['id'],
                    'is_pos_payment': true,
                    'amount': payment,
                    'partner_id': partner['id'],
                    'employee_id': this.cashier ? this.cashier.id : false,
                    'journal_id': paymentMethod['journal_id'][0],
                    'payment_type': 'inbound',
                    'partner_type': 'customer',
                    'ref': reference,
                }],
            });
            return { paymentId, paymentName, ok }
        }
        async get_payment_by_id(id) {
            const backendPayment = await this.env.services.rpc({
                model: 'account.payment',
                method: 'export_for_ui',
                args: [id],
                context: this.env.session.user_context,
            });
            const payment = AccountPayment.create({}, { pos: this.env.pos, json: backendPayment[0] });
            return payment
        }

        getPayDefaultSearchDetails() {
            return {
                fieldName: 'PAYMENT_NUMBER',
                searchTerm: '',
            };
        }

    }
    Registries.Model.extend(PosGlobalState, PosPaymentGlobalState);

    class AccountPayment extends PosGlobalState {
        constructor(obj, options) {
            super(obj);
            options = options || {};
            this.pos = options.pos;
            this.amount = 0;
            this.date = null;
            this.pos_session = "";
            this.pos_session_id = this.pos.pos_session.id;
            this.journal = this.journal || "";
            this.journal_id = this.journal_id || false;
            this.pos_payment_method = this.pos_payment_method || "";
            this.pos_payment_method_id = this.pos_payment_method_id || false;
            this.employee_id = this.employee_id || null;
            this.partner = null;
            this.cashier = null;
            this.ref = null;

            if (options.json) {
                this.init_from_JSON(options.json);
            }
        }
        init_from_JSON(json) {
            this.name = json.name;
            this.amount = json.amount;
            this.pos_session = json.pos_session;
            this.pos_session_id = json.pos_session_id;
            this.journal = json.journal;
            this.journal_id = json.journal_id;
            this.pos_payment_method = json.pos_payment_method;
            this.pos_payment_method_id = json.pos_payment_method_id;
            this.user_id = json.user_id;
            this.cashier = json.cashier;
            this.employee_id = json.employee_id;
            this.date = json.date;
            this.state = json.state;
            this.ref = json.ref;
            let partner;
            if (json.partner_id) {
                partner = this.pos.db.get_partner_by_id(json.partner_id);
                if (!partner) {
                    console.error('ERROR: trying to load a partner not available in the pos');
                }
            } else {
                partner = null;
            }
            this.partner = partner;
            this.backendId = json.backendId;
        }

        // returns the amount of money on this paymentline
        get_amount() {
            return this.amount;
        }

        textToBase64Barcode(text) {
            var canvas = document.createElement("canvas");
            JsBarcode(canvas, text, {displayValue: false, height: 45, width: 1.4});
            return canvas.toDataURL("image/png");
        }

        //exports as JSON for receipt printing
        export_for_printing() {
            let company = this.pos.company;
            let date = this.date;
            var receipt = {
                amount: this.amount,
                name: this.name,
                paymentMethod: this.pos_payment_method,
                partner: this.partner ? this.partner : null,
                cashier: this.cashier,
                date: date,
                ref: this.ref,
                img_barcode: this.textToBase64Barcode(this.name),
                company: {
                    name: company.name,
                    logo: this.pos.company_logo_base64,
                    street: company.street,
                    street2: company.street2,
                    state: company.state_id ? company.state_id[1] : false,
                    country: company.country_id ? company.country[1] : false,
                    city: company.city,
                    zip: company.zip,
                    phone: company.phone,
                    mobile: company.mobile,
                    registry: company.company_registry,
                    vat: company.vat,
                },
                currency: this.pos.currency,
            };

            return receipt;
        }

        /**
        * @returns {Object} object to use as props for instantiating PaymentReceipt.
        */
        getPaymentReceiptEnv() {
            // Formerly get_receipt_render_env defined in ScreenWidget.
            return {
                payment: this,
                receipt: this.export_for_printing(),
            };
        }

        get_partner() {
            return this.partner;
        }
        get_partner_name() {
            let partner = this.partner;
            return partner ? partner.name : "";
        }
    }
    Registries.Model.add(AccountPayment);

    return {
        AccountPayment,
    };
});
