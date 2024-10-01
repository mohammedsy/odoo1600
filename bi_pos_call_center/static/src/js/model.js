odoo.define('bi_pos_call_center.model', function(require) {
	"use strict";

	const { PosGlobalState, Order, Orderline, Payment } = require('point_of_sale.models');
	const Registries = require('point_of_sale.Registries');
	var rpc = require('web.rpc');
	var utils = require('web.utils');
	var round_pr = utils.round_precision;
	var PosDB = require('point_of_sale.DB');
	

	const POSCallCenter = (PosGlobalState) => class POSCallCenter extends PosGlobalState {

		async _processData(loadedData) {
	        await super._processData(...arguments);
	        this._loadPosConfig(loadedData['pos_configs']);
        }
        _loadPosConfig(pos_config){
        	var self=this;
        	self.sessions = pos_config;
        }
    }
    Registries.Model.extend(PosGlobalState, POSCallCenter);
	const PosOrder = (Order) => class PosOrder extends Order {
		initialize(attr, options) {
	        super.initialize(attr, options);
	        this.order_note = "";
            this.save_to_db();
            this.call_order_id = "";
            this.call_id = false;
	    }
		init_from_JSON(json){
			super.init_from_JSON(...arguments);	
			var self=this;
			self.order_note = json.order_note;
            self.call_order_id = json.call_order_id;
            self.call_id = json.call_id;
 		}
 		export_as_JSON(){
 			var self = this;
            var json=super.export_as_JSON(...arguments);
            json.order_note = this.order_note;
            json.send_order_date = this.send_order_date;
            json.branch_id = this.branch_id;
            json.priority = this.priority;
            json.call_order_id = this.call_order_id;
            json.call_id = this.call_id;
            return json;
 		}
		
	}
	Registries.Model.extend(Order, PosOrder);

	const PosOrderLine = (Orderline) => class PosOrderLine extends Orderline {
		initialize(attr, options) {
	        super.initialize(attr, options);
	        this.line_note = this.line_note || "";
	    }
		init_from_JSON(json){
			super.init_from_JSON(...arguments);	
			var self=this;
			self.line_note = json.line_note || "";
 		}
 		export_as_JSON(){
 			var self = this;
            var json=super.export_as_JSON(...arguments);
            json.line_note = this.line_note || "";
            return json;
 		}
 		export_for_printing(){
 			var self = this;
            var json=super.export_for_printing(...arguments);
            json.line_note = self.line_note || "";
            return json;
 		}
 		set_line_note(line_note){
 			this.line_note = line_note;
 		}
 		get_line_note(){
 			return this.line_note;
 		}
			
	}
	Registries.Model.extend(Orderline, PosOrderLine);

});
