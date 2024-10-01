odoo.define('bi_pos_call_center.CallOrderLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class CallOrderLine extends PosComponent {
        setup() {
            super.setup();
        }
    }
    CallOrderLine.template = 'CallOrderLine';

    Registries.Component.add(CallOrderLine);

    return CallOrderLine;
});
