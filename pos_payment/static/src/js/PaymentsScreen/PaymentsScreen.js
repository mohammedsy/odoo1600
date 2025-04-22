odoo.define('pos_payment.PaymentsScreen', function (require) {
    'use strict';

    const { AccountPayment } = require('pos_payment.models');
    const Registries = require('point_of_sale.Registries');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { useListener } = require("@web/core/utils/hooks");
    const { parse } = require('web.field_utils');
    const { _lt } = require('@web/core/l10n/translation');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { onMounted, onWillUnmount, useState } = owl;

    class PaymentsScreen extends IndependentToOrderScreen {
        setup() {
            super.setup();
            useListener('filter-selected', this._onFilterSelected);
            useListener('search', this._onSearch);
            useListener('next-page', this._onNextPage);
            useListener('prev-page', this._onPrevPage);
            useListener('click-payment', this._onClickPayment);
            useListener('create-new-payment', this._onCreateNewPayment);
            useListener('print-payment', this._onPrintPayment);
            NumberBuffer.use({
                nonKeyboardInputEvent: 'numpad-click-input',
            });
            this._state = this.env.pos.PAYMENT_SCREEN_STATE;
            this.state = useState({
                showSearchBar: !this.env.isMobile,
                selectedPayment: false,
            });
            const defaultUIState = this.props.reuseSavedUIState
                ? this._state.ui
                : {
                    selectedPaymentId: null,
                    searchDetails: this.env.pos.getPayDefaultSearchDetails(),
                };
            Object.assign(this._state.ui, defaultUIState, this.props.ui || {});

            onMounted(this.onMounted);
            onWillUnmount(this.onWillUnmount);
        }

        //#region LIFECYCLE METHODS
        onMounted() {
            this.env.posbus.on('payment-button-clicked', this, this.close);
            setTimeout(() => {
                // Show updated list of synced payments when going back to the screen.
                this._onFilterSelected({ detail: { filter: this._state.ui.filter } });
            });
        }
        onWillUnmount() {
            this.env.posbus.off('payment-button-clicked', this);
        }

        //#endregion
        //#region EVENT HANDLERS
        _onClickPayment({ detail: clickedPayment }) {
            if (this._state.ui.selectedPaymentId == clickedPayment.backendId) {
                this._state.ui.selectedPaymentId = null;
            } else {
                this._state.ui.selectedPaymentId = clickedPayment.backendId;
            }
            NumberBuffer.reset();
        }

        async _onCreateNewPayment() {
            const { confirmed, payload } = await this.showPopup('PaymentPopup');
            if (!confirmed) return;
            const { paymentId, paymentName, ok } = await this.env.pos.registerPaymentToBackend(payload)
            if (!ok) return;
            this.trigger("update-payment-count")
            await this._fetchSyncedPayments();
            const { payment } = payload;
            const formattedPayment = this.env.pos.format_currency(payment);
            this.showNotification(
                _.str.sprintf(this.env._t('Successfully register payment (%s) with amount %s.'), paymentName, formattedPayment),
                4000
            );
            const paymentObj = await this.env.pos.get_payment_by_id(paymentId)
            this.showScreen('PrintPaymentScreen', { payment: paymentObj });
        }

        async _onFilterSelected(event) {
            this._state.ui.filter = event.detail.filter;
            await this._fetchSyncedPayments();
        }

        async _onSearch(event) {
            Object.assign(this._state.ui.searchDetails, event.detail);
            this._state.syncedPayments.currentPage = 1;
            await this._fetchSyncedPayments();
        }

        async _onNextPage() {
            if (this._state.syncedPayments.currentPage < this._getLastPage()) {
                this._state.syncedPayments.currentPage += 1;
                await this._fetchSyncedPayments();
            }
        }
        async _onPrevPage() {
            if (this._state.syncedPayments.currentPage > 1) {
                this._state.syncedPayments.currentPage -= 1;
                await this._fetchSyncedPayments();
            }
        }

        async _onPrintPayment({ detail: payment }) {
            this.showScreen('PrintPaymentScreen', { payment });
        }

        //#endregion
        //#region HELPERS METHODS
        getDate(payment) {
            return moment(payment.date).format('YYYY-MM-DD');
        }
        getAmount(payment) {
            return this.env.pos.format_currency(payment.get_amount());
        }
        getPartner(payment) {
            return payment.get_partner_name();
        }

        getPaymentList() {
            return this._state.syncedPayments.toShow;
        }
        isHighlighted(payment) {
            return payment.backendId == this._state.ui.selectedPaymentId;
        }

        getSearchBarConfig() {
            return {
                searchFields: new Map(
                    Object.entries(this._getSearchFields()).map(([key, val]) => [key, val.displayName])
                ),
                filter: { show: true, options: this._getFilterOptions() },
                defaultSearchDetails: this._state.ui.searchDetails,
                defaultFilter: this._state.ui.filter,
            };
        }
        shouldShowPageControls() {
            return this._getLastPage() > 1;
        }
        getPageNumber() {
            if (!this._state.syncedPayments.totalCount) {
                return `1/1`;
            } else {
                return `${this._state.syncedPayments.currentPage}/${this._getLastPage()}`;
            }
        }

        /**
        * @returns {Record<string, { repr: (payment: models.AccountPayment) => string, displayName: string, modelField: string }>}
        */
        _getSearchFields() {
            const fields = {
                PAYMENT_NUMBER: {
                    repr: (payment) => payment.name,
                    displayName: this.env._t('Payment Number'),
                    modelField: 'name',
                },
                DATE: {
                    repr: (payment) => moment(payment.date).format('YYYY-MM-DD'),
                    displayName: this.env._t('Date'),
                    modelField: 'date',
                },
                PARTNER: {
                    repr: (payment) => payment.get_partner_name(),
                    displayName: this.env._t('Customer'),
                    modelField: 'partner_id.display_name',
                },
            };
            return fields;
        }

        _getFilterOptions() {
            const states = new Map();
            states.set('ALL', { text: this.env._t('All') });
            states.set('SESSION', { text: this.env._t('Session') });
            return states;
        }


        //#endregion
        //#region SEARCH PAYMENTS

        _computePaymentsDomain() {
            const domain = []
            const { fieldName, searchTerm } = this._state.ui.searchDetails;
            const modelField = this._getSearchFields()[fieldName].modelField;
            if (this._state.ui.filter === "SESSION") {
                domain.push(['pos_session_id', '=', this.env.pos.pos_session.id]);
            }
            if (modelField) {
                domain.push([modelField, 'ilike', `%${searchTerm}%`]);
            }
            return domain
        }

        /**
         * Fetches the done payments from the backend that needs to be shown.
         * If the payment is already in cache, the full information about that
         * payment is not fetched anymore, instead, we use info from cache.
         */
        async _fetchSyncedPayments() {
            const domain = this._computePaymentsDomain();
            const limit = this._state.syncedPayments.nPerPage;
            const offset = (this._state.syncedPayments.currentPage - 1) * this._state.syncedPayments.nPerPage;
            const { ids, totalCount } = await this.rpc({
                model: 'account.payment',
                method: 'search_from_ui',
                kwargs: { domain, limit, offset },
                context: this.env.session.user_context,
            });
            const idsNotInCache = ids.filter((id) => !(id in this._state.syncedPayments.cache));
            if (idsNotInCache.length > 0) {
                const fetchedPayments = await this.rpc({
                    model: 'account.payment',
                    method: 'export_for_ui',
                    args: [idsNotInCache],
                    context: this.env.session.user_context,
                });
                // Check for missing partners and load them in the PoS
                await this.env.pos._loadMissingPartners(fetchedPayments);
                // Cache these fetched payments so that next time, no need to fetch them again.
                fetchedPayments.forEach((payment) => {
                    this._state.syncedPayments.cache[payment.backendId] = AccountPayment.create({}, { pos: this.env.pos, json: payment });
                });
            }
            this._state.syncedPayments.totalCount = totalCount;
            this._state.syncedPayments.toShow = ids.map((id) => this._state.syncedPayments.cache[id]);
        }
        _getLastPage() {
            const totalCount = this._state.syncedPayments.totalCount;
            const nPerPage = this._state.syncedPayments.nPerPage;
            const remainder = totalCount % nPerPage;
            if (remainder == 0) {
                return totalCount / nPerPage;
            } else {
                return Math.ceil(totalCount / nPerPage);
            }
        }
        //#endregion
        //#endregion
    }
    PaymentsScreen.template = 'PaymentsScreen';
    PaymentsScreen.defaultProps = {
        // When passed as true, it will use the saved _state.ui as default
        // value when this component is reinstantiated.
        // After setting the default value, the _state.ui will be overridden
        // by the passed props.ui if there is any.
        reuseSavedUIState: false,
        ui: {},
    };

    Registries.Component.add(PaymentsScreen);
    PaymentsScreen.searchPlaceholder = _lt('Search Payments...');

    return PaymentsScreen;
});
