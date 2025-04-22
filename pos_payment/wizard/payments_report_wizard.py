from odoo import models, fields, _
from odoo.tools.misc import groupby
from datetime import datetime, time
import pytz


class PaymentReportWizard(models.TransientModel):
    _name = 'payment.report.wizard'
    _description = 'Payment Report Wizard'

    def default_get(self, fields_list):
        defaults = super(PaymentReportWizard, self).default_get(fields_list)

        # Get the user's timezone
        user_tz = self.env.user.tz or 'UTC'
        tz = pytz.timezone(user_tz)

        # Get current date in the user's timezone
        now = datetime.now(tz)
        start_of_day = tz.localize(datetime.combine(now.date(), time.min)).astimezone(pytz.utc).replace(tzinfo=None)
        end_of_day = tz.localize(datetime.combine(now.date(), time.max)).astimezone(pytz.utc).replace(tzinfo=None)

        # Add default values to defaults dictionary
        defaults.update({
            'date_from': start_of_day,
            'date_to': end_of_day,
        })

        return defaults


    date_from = fields.Datetime(string="From Date")

    date_to = fields.Datetime(string="To Date")

    session_ids = fields.Many2many('pos.session', string='Sessions')

    employee_ids = fields.Many2many('hr.employee', string='Employees')

    filter_by = fields.Selection([
        ('period', 'Period'),
        ('session', 'Sessions'),
    ], default='period', required=True)


    def print_report(self):
        # Call the method in pos.session to generate the data
        payments = self.get_payments()
        data={
            'payments': payments,
            'filter_by': self.filter_by,
        }
        if self.filter_by == 'period':
            date_from = fields.Datetime.context_timestamp(self, self.date_from).strftime('%Y-%m-%d %H:%M')
            date_to = fields.Datetime.context_timestamp(self, self.date_to).strftime('%Y-%m-%d %H:%M')
            data['date_from'] = date_from
            data['date_to'] = date_to
        return self.env.ref('pos_payment.wizard_payments_report_action').report_action([], data=data)

     # -------- Reportt Functions -----------

    def _prepare_payments_vals(self, payment_ids, method, cashier):
        amount = sum(payment_ids.mapped('amount'))
        return {
            'cashier': cashier.name,
            'method': method.name,
            'amount': round(amount, 2),
        }

    def _get_payments_groupby_cashier(self, payment_ids, model_name):
        if model_name == "pos.payment":
            return groupby(payment_ids, key=lambda payment: payment.pos_order_id.employee_id)
        return groupby(payment_ids, key=lambda payment: payment.employee_id)

    def _get_payment_domain(self, model_name, session_field, date_field):
        payment_domain = []
        if self.filter_by == 'period':
            payment_domain = [
                (date_field, '>=', self.date_from),
                (date_field, '<=', self.date_to),
            ]
        else:
            payment_domain = [
                (session_field, 'in', self.session_ids.ids)
            ]
        if model_name == "account.payment":
            payment_domain.append(('is_pos_payment', '=', True))
            if self.employee_ids:
                payment_domain.append(('employee_id', 'in', self.employee_ids.ids))
        if model_name == "pos.payment":
            if self.employee_ids:
                payment_domain.append(('pos_order_id.employee_id', 'in', self.employee_ids.ids))
        return payment_domain

    def _get_payments(self, model_name, session_field, method_field, date_field):
        payments = []
        payment_domain = self._get_payment_domain(model_name, session_field, date_field)
        PaymentModel = self.env[model_name]
        payment_ids = PaymentModel.search(payment_domain)
        payments_groupby_cashier = self._get_payments_groupby_cashier(payment_ids, model_name)
        for cashier, cashier_payments in payments_groupby_cashier:
            cashier_payment_ids = PaymentModel.concat(*cashier_payments)
            payments_groupby_method = groupby(cashier_payment_ids, key=lambda payment: getattr(payment, method_field))
            for method, method_payments in payments_groupby_method:
                method_payment_ids = PaymentModel.concat(*method_payments)
                vals = self._prepare_payments_vals(method_payment_ids, method, cashier)
                payments.append(vals)
        return payments


    def _get_pos_payments(self):
        return self._get_payments('pos.payment', 'session_id', 'payment_method_id', 'payment_date')

    def _get_account_payments(self):
        return self._get_payments('account.payment', 'pos_session_id', 'journal_id', 'create_date')

    def get_payments(self):
        pos_payments = self._get_pos_payments()
        account_payments = self._get_account_payments()

        payments = [{
                'title': _("Point of sale Payments"),
                'payments': pos_payments
            },{
                'title': _("Voucher Receipts"),
                'payments': account_payments
        }]
        return payments


