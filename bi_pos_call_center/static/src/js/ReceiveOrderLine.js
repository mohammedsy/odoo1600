odoo.define('bi_pos_call_center.ReceiveOrderLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require("@web/core/utils/hooks");

    class ReceiveOrderLine extends PosComponent {
        setup() {
            super.setup();
            useListener('click-reprint', this.clickReprint);
        }
        GetFormattedDate(date) {
            var month = ("0" + (date.getMonth() + 1)).slice(-2);
            var day  = ("0" + (date.getDate())).slice(-2);
            var year = date.getFullYear();
            var hour =  ("0" + (date.getHours())).slice(-2);
            var min =  ("0" + (date.getMinutes())).slice(-2);
            var seg = ("0" + (date.getSeconds())).slice(-2);
            return year + "-" + month + "-" + day + " " + hour + ":" +  min + ":" + seg;
        }

        get_order_date(dt){
            let a=dt.split("T");   
            let a1=a[0]+'T';
            let a2=a[1]+'Z';
            let final_date=a1+a2;
            let date = new Date(final_date);
            let new_date = this.GetFormattedDate(date);
            return new_date
        }
        async clickReprint(event){
            let self = this;
            let order = event.detail;

            await self.rpc({
                    model: 'pos.call.order',
                    method: 'print_pos_receipt',
                    args: [order.id],
                }).then(function(output) {
                    let data = output;
                    data['order'] = order;
                    self.showTempScreen('ReceiveOrderPrint',data);
                });

        }
    }
    ReceiveOrderLine.template = 'ReceiveOrderLine';

    Registries.Component.add(ReceiveOrderLine);

    return ReceiveOrderLine;
});
