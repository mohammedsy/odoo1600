# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Call Center | POS Transfer Order to Different Branches',
    'version': '16.0.0.0',
    'category': 'Point of Sale',
    'summary': 'Point of Sales call center POS Customer Centre POS Customer Support Centre POS Customer Service Centre Point of Sales Transfer order POS branch transfer order to branch on Point of sales order transfer point of sales branch order transfer pos branch orders',
    'description' :"""
        This odoo app helps the user to operate a call center and call center branches in a point of sale. Users can transfer orders to multiple call center branch from the main call center and added products, quantities, discounts, and the price will be transferred to that branch. On receiving the sent order same order was added to the pos cart for that branch.
    """,
    'author': 'BrowseInfo',
    'website': 'https://www.browseinfo.in',
    "price": 99,
    "currency": 'EUR',
    'depends': ['base','point_of_sale'],
    'data': [
        'security/ir.model.access.csv',
        'data/data_view.xml',
        'views/pos_view.xml',
        'views/pos_call_order_view.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'bi_pos_call_center/static/src/css/pos.css',
            'bi_pos_call_center/static/src/js/model.js',
            'bi_pos_call_center/static/src/js/Orderlinenote.js',
            'bi_pos_call_center/static/src/js/CallOrderLine.js',
            'bi_pos_call_center/static/src/js/OrderlineNotePopupWidget.js',
            'bi_pos_call_center/static/src/js/Orderlist.js',
            'bi_pos_call_center/static/src/js/TransferOrderButton.js',
            'bi_pos_call_center/static/src/js/CreateTransferOrderPopupWidget.js',
            'bi_pos_call_center/static/src/js/OrdersScreen.js',
            'bi_pos_call_center/static/src/js/ReceiveOrderButton.js',
            'bi_pos_call_center/static/src/js/PosCallOrdersDetail.js',
            'bi_pos_call_center/static/src/js/ReceiveScreenWidget.js',
            'bi_pos_call_center/static/src/js/ReceiveOrderLine.js',
            'bi_pos_call_center/static/src/js/ReceiveOrderPrint.js',
            'bi_pos_call_center/static/src/js/ReceiveOrderReceipt.js',
            'bi_pos_call_center/static/src/js/TransferOrderReceipt.js',
            'bi_pos_call_center/static/src/xml/pos.xml',
        ],
    },
    'license':'OPL-1',
    'demo': [],
    'test': [],
    'installable': True,
    'auto_install': False,
    'live_test_url':'https://youtu.be/6xkCXgMKThs',
    "images":['static/description/Banner.gif'],
}
