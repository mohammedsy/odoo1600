from odoo import models, fields, _, api
from odoo.exceptions import UserError
from odoo.tools.misc import groupby
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT

class PosSession(models.Model):
    _inherit = "pos.session"

    total_customer_payments_amount = fields.Float(compute='_compute_total_customer_payments_amount', string='Total Payments Amount')

    # -------- Reportt Functions -----------

    def get_start_at_date(self):
        start_at_user_tz = fields.Datetime.context_timestamp(self, self.start_at).strftime('%Y-%m-%d %H:%M')
        return start_at_user_tz
    def get_stop_at_date(self):
        stop_at_user_tz = fields.Datetime.context_timestamp(self, self.stop_at).strftime('%Y-%m-%d %H:%M')
        return stop_at_user_tz

    def _prepare_payments_vals(self, payment_ids, method, cashier):
        amount = sum(payment_ids.mapped('amount'))
        return {
            'cashier': cashier,
            'method': method,
            'amount': round(amount, 2),
        }

    def _get_payments_groupby_cashier(self, payment_ids, model_name):
        if model_name == "pos.payment":
            return groupby(payment_ids, key=lambda payment: payment.pos_order_id.employee_id)
        return groupby(payment_ids, key=lambda payment: payment.employee_id)


    def _get_payments(self, model_name, session_field, method_field, cashier):
        payments = []
        payment_domain = [(session_field, '=', self.id)]
        if model_name == "account.payment":
            payment_domain.append(('is_pos_payment', '=', True))
        if cashier:
            if model_name == "pos.payment":
                payment_domain.append(('pos_order_id.employee_id', '=', cashier))
            if model_name == "account.payment":
                payment_domain.append(('employee_id', '=', cashier))
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

    def _get_pos_payments(self, cashier):
        return self._get_payments('pos.payment', 'session_id', 'payment_method_id', cashier)

    def _get_account_payments(self, cashier):
        return self._get_payments('account.payment', 'pos_session_id', 'journal_id', cashier)

    def get_payments(self, cashier=False):
        pos_payments = self._get_pos_payments(cashier)
        account_payments = self._get_account_payments(cashier)
        payments = [{
                'title': _("Point of sale Payments"),
                'payments': pos_payments
            },{
                'title': _("Voucher Receipts"),
                'payments': account_payments
        }]
        return payments

    # ---------------------------------------------------------

    @api.depends()
    def _compute_total_customer_payments_amount(self):
        result = self.env['account.payment']._read_group([
            ('pos_session_id', 'in', self.ids), ('is_pos_payment', '=', True)],
            ['amount'], ['pos_session_id']
        )
        session_amount_map = dict((data['pos_session_id'][0], data['amount']) for data in result)
        for session in self:
            session.total_customer_payments_amount = session_amount_map.get(session.id) or 0
    def action_show_customer_payments_list(self):
        return {
            'name': _('Customer Payments'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.payment',
            'view_mode': 'tree,form',
            'domain': [('pos_session_id', '=', self.id), ('is_pos_payment', '=', True)],
            'context': {'customer_payments_list': True},
        }

    # =========================================================
    # UI Functions
    # =========================================================

    # TODO:
    # Use this to load ALL the account.payment records
    # to the UI/POS on start pos check start() method on Chrome component.
    # @api.model
    # def _pos_ui_models_to_load(self):
    #     result = super()._pos_ui_models_to_load()
    #     result.append('account.payment')
    #     return result

    def export_session_balances_for_ui(self, cashier=False):
        payments = self.get_payments(cashier)
        for payment in payments:
            payment['payments'] = [
                {
                    'cashier': p['cashier'],
                    'method': p['method'].name if p['method'] else 'Unknown',
                    'amount': p['amount']
                }
                for p in payment['payments']
            ]

        return payments

    def _loader_params_pos_payment_method(self):
        result = super()._loader_params_pos_payment_method()
        result['search_params']['fields'].append('journal_id')
        return result

    def _loader_params_res_company(self):
        result = super()._loader_params_res_company()
        result['search_params']['fields'].append('mobile')
        result['search_params']['fields'].append('street')
        result['search_params']['fields'].append('street2')
        result['search_params']['fields'].append('city')
        result['search_params']['fields'].append('zip')
        return result

    def _loader_params_account_payment(self):
        return {
            'search_params': {
                'domain': [('state', '=', 'posted'), ('is_pos_payment', '=', True)],
                'fields': ['name', 'date', 'amount', 'partner_id', 'employee_id', 'ref', 'journal_id'],
            },
        }

    def _get_pos_ui_account_payment(self, params):
        return self.env['account.payment'].search_read(**params['search_params'])
