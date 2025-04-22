/** @odoo-module **/

import AbstractAwaitablePopup from 'point_of_sale.AbstractAwaitablePopup';
import Registries from 'point_of_sale.Registries';
import { qweb as QWeb } from 'web.core';  // ✅ هنا استدعاء QWeb
const rpc = require('web.rpc');

class BookOrderPopup extends AbstractAwaitablePopup {
    setup() {
        super.setup();
        this.order = this.env.pos.selectedOrder;
    }

    async onConfirm() {
        var pickup_date = this.el.querySelector('#pickup_date').value;
        var delivery_date = this.el.querySelector('#deliver_date').value;
        var order_note = this.el.querySelector('.order_note').value;
        var partner = this.order.partner.id;
        var address = this.el.querySelector('#delivery_address').value;
        var phone = this.el.querySelector('#phone').value;
        var date = this.order.creation_date;
        var line = this.order.orderlines;
        var price_list = this.order.pricelist.id;
        var product = {
            'product_id': [],
            'qty': [],
            'price': []
        };
        if (!phone || phone.trim() === "") {
        this.showPopup('ErrorPopup', {
            title: this.env._t('خطأ'),
            body: this.env._t('يرجى إدخال رقم الجوال قبل تأكيد الطلب!'),
        });
        return;
    }

        // جمع بيانات المنتجات
        for (var i = 0; i < line.length; i++) {
            product['product_id'].push(line[i].product.id);
            product['qty'].push(line[i].quantity);
            product['price'].push(line[i].price);
        }

        // إرسال الطلب إلى الخادم لإنشاء أمر محجوز
       const bookingNumber = await rpc.query({
            model: 'book.order',
            method: 'create_booked_order',
            args: [partner, phone, address, date, price_list, product, order_note, pickup_date, delivery_date]
        });
 
    let receiptHtml = `
        <div style="font-family: 'Arial', sans-serif; direction: rtl; text-align: right;">
            <div style="text-align: center; font-size: 18px; font-weight: bold;">
                🍞 مخابز آجياد الشرق
            </div>
            <div style="text-align: center; font-size: 14px;">
                إيصال تأكيد حجز الطلب
            </div>
            <hr style="border: 1px dashed #000;">
            <div>
                <strong>رقم الطلب:</strong> ${bookingNumber}<br>
                <strong>العميل:</strong> ${this.order.get_partner() ? this.order.get_partner().name : "بدون اسم"}<br>
                <strong>رقم الجوال:</strong> ${phone}<br>
                <strong>موعد الاستلام:</strong> ${pickup_date}<br>
            </div>
            <hr style="border: 1px dashed #000;">
            
            <!-- عرض تفاصيل الأصناف بشكل منظم باستخدام جدول -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: right; border: 1px solid #000; padding: 5px;">اسم الصنف</th>
                        <th style="text-align: right; border: 1px solid #000; padding: 5px;">الكمية</th>
                    </tr>
                </thead>
                <tbody>
                    ${line.map(item => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; text-align: right;">${item.product.display_name}</td>
                            <td style="border: 1px solid #000; padding: 5px; text-align: right;">${item.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <hr style="border: 1px dashed #000;">
            
            <!-- إضافة كود الباركود -->
            <div style="text-align: center; margin-top: 10px;">
                <svg id="barcode"></svg>
                <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                <script type="text/javascript">
                    JsBarcode("#barcode", "${bookingNumber}", {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 16
                    });
                </script>
            </div>
            
            <hr style="border: 1px dashed #000;">
            <div style="text-align: center;">
                شكراً لتعاملكم معنا 💖<br>
 
            </div>
        </div>
    `;

    let printed = false;

    // محاولة الطباعة التلقائية
    try {
        if (this.env.pos.proxy && this.env.pos.proxy.printer) {
            await this.env.pos.proxy.printer.print_receipt(receiptHtml);
            printed = true;
        } else if (this.env.pos.printer) {
            this.env.pos.printer.print_receipt(receiptHtml);
            printed = true;
        }
    } catch (error) {
        console.warn("فشل الطباعة التلقائية:", error);
    }

    // في حال فشل الطباعة التلقائية — طباعة عبر المتصفح
    if (!printed) {
        const newWindow = window.open('', '', 'width=400,height=600');
        newWindow.document.write(`
            <html>
                <head><title>إيصال الحجز</title></head>
                <body>${receiptHtml}</body>
            </html>
        `);
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
    }

    // حذف المنتجات من الطلب
    while (this.order.get_orderlines().length > 0) {
        this.order.remove_orderline(this.order.get_orderlines()[0]);
    }

    this.cancel();
}
}

// تعيين قالب النافذة المنبثقة
BookOrderPopup.template = 'BookOrderPopup';
Registries.Component.add(BookOrderPopup);