{
    "name": "POS Payment",
    "summary": """
        POS Payment.""",
    "description": """
        POS Payment.""",
    "category": "POS",
    "version": "16.0.1.0.0",
    "license": "AGPL-3",
    "depends": [
        "hr",
        "point_of_sale",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/account_payment.xml",
        "views/pos_session.xml",
        "views/pos_session_payments_report.xml",
        "views/payments_report.xml",
        "wizard/payments_report_wizard.xml",
    ],
   'assets': {
        'point_of_sale.assets': [
            'pos_payment/static/src/lib/**/*',
            'pos_payment/static/src/js/**/*',
            'pos_payment/static/src/xml/**/*',
            'pos_payment/static/src/css/**/*',
        ],
    },
}
