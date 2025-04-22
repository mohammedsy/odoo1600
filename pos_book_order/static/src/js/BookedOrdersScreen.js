/** @odoo-module **/

import { useState } from "@odoo/owl";
import Registries from 'point_of_sale.Registries';
import TicketScreen from 'point_of_sale.TicketScreen';
import { useListener } from "@web/core/utils/hooks";
import { debounce } from "@web/core/utils/timing";

class BookedOrdersScreen extends TicketScreen {
    setup() {
        super.setup();
        useListener('click-confirm', this._Confirm);
        
        this.state = useState({
            searchTerm: "",
            filteredOrders: this.props.data || []
        });
        
        this.onSearch = this.onSearch.bind(this);
        this.debouncedSearch = debounce(this.performSearch.bind(this), 300);
    }

    onSearch(event) {
        this.state.searchTerm = event.target.value.toLowerCase();
        this.debouncedSearch();
    }

    performSearch() {
        if (!this.state.searchTerm) {
            this.state.filteredOrders = this.props.data || [];
            return;
        }
        
        this.state.filteredOrders = (this.props.data || []).filter(order => {
            const searchFields = [
                order.name,
                order.partner_name,
                order.phone,
                order.address,
                order.total
            ];
            return searchFields.some(field => 
                field && field.toString().toLowerCase().includes(this.state.searchTerm)
            );
        });
    }

    back() {
        this.showScreen('ProductScreen');
    }

    _Confirm(ev) {
        const { detail } = ev;
        this.env.pos.add_new_order();
        
        detail.products.forEach(item => {
            const product = this.env.pos.db.get_product_by_id(item.id);
            this.env.pos.get_order().add_product(product, {
                quantity: item.qty,
                price: item.price
            });
        });
        
        if (detail.partner_id) {
            const partner = this.env.pos.db.get_partner_by_id(detail.partner_id);
            this.env.pos.get_order().set_partner(partner);
        }
        
        this.env.pos.selectedOrder.is_booked = true;
        this.env.pos.selectedOrder.booked_data = detail;
        this.showScreen('ProductScreen');
    }
}

BookedOrdersScreen.template = 'BookedOrdersScreen';
Registries.Component.add(BookedOrdersScreen);