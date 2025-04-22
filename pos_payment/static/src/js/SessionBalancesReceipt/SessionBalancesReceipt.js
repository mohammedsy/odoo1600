odoo.define('pos_payment.SessionBalancesReceipt', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class SessionBalancesReceipt extends PosComponent {
        setup() {
            super.setup();
        }

        get currency() {
            return this.pos.currency
        }
        get company() {
            let company = this.env.pos.company;
            company= {
                name: company.name,
                logo: this.env.pos.company_logo_base64,
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
            }
            return company;
        }
        get cashier() {
            return this.env.pos.get_cashier().name;
        }
        get session() {
            return this.this.env.pos.pos_session;
        }

        get printDate() {
            const options = this._getDateFmtOptions()
            return new Date().toLocaleString('en-GB', options); // 'en-GB' ensures day/month/year format
        }

        get start_at() {
            let start_at = this.env.pos.pos_session.start_at;
            const options = this._getDateFmtOptions()
            // Convert the start_at string (which is in UTC) to a Date object
            let utcDate = new Date(start_at + ' UTC'); // append ' UTC' to ensure correct interpretation
            // Convert to the user's timezone and format
            return utcDate.toLocaleString('en-GB', options); // 'en-GB' ensures day/month/year format
        }

        _getDateFmtOptions() {
            return {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
        }
    }
    SessionBalancesReceipt.template = 'SessionBalancesReceipt';

    Registries.Component.add(SessionBalancesReceipt);

    return SessionBalancesReceipt;
});
