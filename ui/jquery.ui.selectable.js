var trip = false;

/*
 * jQuery UI Selectable @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Selectables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

$.widget("ui.selectable", $.ui.mouse, {
	version: "@VERSION",
	options: {
		appendTo: 'body',
		autoRefresh: true,
		distance: 0,
		filter: '*',
		tolerance: 'touch',
		invertMeta: false
	},
	_create: function() {
		var self = this;

		this.element.addClass("ui-selectable");

		this.dragged = false;

		// cache selectee children based on filter
		var selectees;
		this.refresh = function() {
			selectees = $(self.options.filter, self.element[0]);
			selectees.addClass("ui-selectee");
			selectees.each(function() {
				var $this = $(this);
				var pos = $this.offset();
				$.data(this, "selectable-item", {
					element: this,
					$element: $this,
					left: pos.left,
					top: pos.top,
					right: pos.left + $this.outerWidth(),
					bottom: pos.top + $this.outerHeight(),
					startselected: false,
					selected: $this.hasClass('ui-selected'),
					selecting: $this.hasClass('ui-selecting'),
					unselecting: $this.hasClass('ui-unselecting')
				});
			});
		};
		this.refresh();

		this._select = function(selectee,quiet){
			self._set_ui_selectable_info(selectee,'selected',true);
			self._set_ui_selectable_info(selectee,'selecting',false);
			self._set_ui_selectable_info(selectee,'unselecting',false);
			if(!quiet){
				self._trigger("selected", event, {
					selected: selectee.element
				});
			}
		};
		this._unselect = function(selectee){
			self._set_ui_selectable_info(selectee,'selected',false);
			self._set_ui_selectable_info(selectee,'selecting',false);
			self._set_ui_selectable_info(selectee,'unselecting',false);
			self._trigger("unselected", event, {
				unselected: selectee.element
			});
		};
		this._selecting = function(selectee){
			self._set_ui_selectable_info(selectee,'selected',false);
			self._set_ui_selectable_info(selectee,'unselecting',false);
			if(self._set_ui_selectable_info(selectee,'selecting',true)){
				self._trigger("selecting", event, {
					selecting: selectee.element
				});
			}
		};
		this._unselecting = function(selectee){
			self._set_ui_selectable_info(selectee,'selected',false);
			self._set_ui_selectable_info(selectee,'selecting',false);
			if(self._set_ui_selectable_info(selectee,'unselecting',true)){
				self._trigger("unselecting", event, {
					unselecting: selectee.element
				});				
			}
		};
		this._invert = function(selectee){
			if (selectee.startselected) {
				self._unselecting(selectee);
			} else {
				self._selecting(selectee);
			}
		};
		this._revert = function(selectee){
			if (selectee.startselected) {
				self._selecting(selectee);
			} else {
				self._unselecting(selectee);
			}
		};
		

		this._set_ui_selectable_info = function(selectee,type,add){
			if (selectee[type] !== add) {
				selectee.$element.toggleClass('ui-'+type);
				selectee[type] = add;
				return true;
			}
			return false;
		};

		this.selectees = selectees.addClass("ui-selectee");

		this._mouseInit();

		this.helper = $("<div class='ui-selectable-helper'></div>");
	},

	destroy: function() {
		this.selectees
			.removeClass("ui-selectee")
			.removeData("selectable-item");
		this.element
			.removeClass("ui-selectable ui-selectable-disabled")
			.removeData("selectable")
			.unbind(".selectable");
		this._mouseDestroy();

		return this;
	},

	_mouseStart: function(event) {
		var self = this;

		this.opos = [event.pageX, event.pageY];
		metaKeyDown = (event.metaKey || event.ctrlKey);
		this.meta = ((metaKeyDown || this.options.invertMeta) && !(metaKeyDown && this.options.invertMeta));

		if (this.options.disabled)
			return;

		var options = this.options;

		this.selectees = $(options.filter, this.element[0]);

		this._trigger("start", event);

		$(options.appendTo).append(this.helper);
		// position helper (lasso)
		this.helper.css({
			"left": event.clientX,
			"top": event.clientY,
			"width": 0,
			"height": 0
		});

		if (options.autoRefresh) {
			this.refresh();
		}

		// find top selectee ancestor of event.target
		var target = $(event.target).parents().andSelf().filter(".ui-selectee").first();
		var selectee = target.data("selectable-item");
		if(target.hasClass('ui-selected')){
			selectee.startselected = true;
		}
		this.oposJQ = target;

		/// unselecting selected, if no meta key
		this.selectees.filter('.ui-selected').not(target).each(function() {
			var selectee = $.data(this, "selectable-item");
			selectee.startselected = true;
			if (!self.meta) {
				self._unselecting(selectee);
			}
		});

		// if meta
		// invert target
		// else selecting target, unselect the rest
		if (this.meta) {
			this._invert(selectee);
		} else {
			this._selecting(selectee);
		}
	},

	_mouseDrag: function(event) {
		var self = this;
		this.dragged = true;

		if (this.options.disabled)
			return;

		var options = this.options;

		var x1 = this.opos[0], y1 = this.opos[1], x2 = event.pageX, y2 = event.pageY;

		var target;
		this.selectees.each(function() {
			var selectee = $.data(this, "selectable-item");
			//prevent helper from being selected if appendTo: selectable
			if (!selectee || selectee.element == self.element[0])
				return;
			if(!(selectee.left > x2 || selectee.right < x2 || selectee.top > y2 || selectee.bottom < y2)){
				target = selectee.$element;
				return false;
			}
		});
		var index1 = this.oposJQ.index();
		if (this.index2 === undefined) {
			this.index2 = index1;
		}
		if (target) {
			target = target.parents().andSelf().filter(".ui-selectee").first();
			this.index2 = target.index();
		}
		var index2 = this.index2;

		if (index1 > index2) { var tmp = index2; index2 = index1; index1 = tmp; }

		if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
		if (y1 > y2) { var tmp = y2; y2 = y1; y1 = tmp; }
		this.helper.css({left: x1, top: y1, width: x2-x1, height: y2-y1});

		this.selectees.each(function() {
			var selectee = $.data(this, "selectable-item");
			//prevent helper from being selected if appendTo: selectable
			if (!selectee || selectee.element == self.element[0])
				return;
			var hit = false;
			if (options.tolerance == 'touch') {
				hit = ( !(selectee.left > x2 || selectee.right < x1 || selectee.top > y2 || selectee.bottom < y1) );
			} else if (options.tolerance == 'fit') {
				hit = (selectee.left > x1 && selectee.right < x2 && selectee.top > y1 && selectee.bottom < y2);
			} else if (options.tolerance == 'sequence') {
				index = selectee.$element.index();
				hit = ((index >= index1) && (index <= index2));
			}

			if (hit) {
				if (self.meta) {
					self._invert(selectee);
				} else {
					self._selecting(selectee);
				}
			} else {
				if (self.meta) {
					self._revert(selectee);
				} else {
					self._unselecting(selectee);
				}
			}
		});
		
		return false;
	},

	_mouseStop: function(event) {
		var self = this;

		this.dragged = false;

		var options = this.options;

		/// unselect unselecting
		$('.ui-unselecting', this.element[0]).each(function() {
			var selectee = $.data(this, "selectable-item");
			self._unselect(selectee);
		});
		/// select selecting
		$('.ui-selecting', this.element[0]).each(function() {
			var selectee = $.data(this, "selectable-item");
			self._select(selectee);
		});
		this._trigger("stop", event);

		this.helper.remove();

		return false;
	}
});

})(jQuery);
