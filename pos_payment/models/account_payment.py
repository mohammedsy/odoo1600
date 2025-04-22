from odoo import models, fields, _, api
from odoo.exceptions import UserError
import pytz
import re
from odoo.osv.expression import AND

class AccountPayment(models.Model):
    _inherit = "account.payment"

    pos_session_id = fields.Many2one('pos.session', readonly=True)
    employee_id = fields.Many2one('hr.employee', 'Cashier', readonly=True)
    is_pos_payment = fields.Boolean(readonly=True)

    @api.model
    def create_from_ui(self, payment):
        payment_id = self.env['account.payment'].create(payment)
        if payment_id:
            payment_id.action_post()
            return { "paymentId": payment_id.id, "paymentName": payment_id.name, "status": 201, "ok": True}
        return { "paymentId": False, "paymentName": False, "status": 500, "ok": False}

    @api.model
    def search_from_ui(self, domain=[], limit=None, offset=None):
        """Search for 'paid' payments that satisfy the given domain, limit and offset."""
        default_domain = [('state', '=', 'posted'), ('is_pos_payment', '=', True)]
        real_domain = AND([domain, default_domain])
        ids = self.search(AND([domain, default_domain]), limit=limit, offset=offset, order="id DESC").ids
        totalCount = self.search_count(real_domain)
        return {'ids': ids, 'totalCount': totalCount}

    def _export_for_ui(self, payment):
        return {
            'name': payment.name,
            'amount': payment.amount,
            'pos_session': payment.pos_session_id.name,
            'pos_session_id': payment.pos_session_id.id,
            'journal': payment.journal_id.name,
            'journal_id': payment.journal_id.id,
            'pos_payment_method': payment.pos_payment_method_id.name,
            'pos_payment_method_id': payment.pos_payment_method_id.id,
            'partner_id': payment.partner_id.id,
            'user_id': payment.user_id.id,
            'employee_id': payment.employee_id.id,
            'cashier': payment.employee_id.name,
            'date': str(payment.date),
            'state': payment.state,
            'backendId': payment.id,
            'ref': payment.ref,
        }

    def export_for_ui(self):
        """ Returns a list of dict with each item having similar signature as the return of
            `export_as_JSON` of models.AccountPayment. This is useful for back-and-forth communication
            between the pos frontend and backend.
        """
        return self.mapped(self._export_for_ui) if self else []
