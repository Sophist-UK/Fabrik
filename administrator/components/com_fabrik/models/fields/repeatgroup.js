/**
 * Admin RepeatGroup Editor
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

var FbRepeatGroup = new Class({

	Implements: [Options, Events],

	options: {
		repeatmin: 1
	},

	initialize: function (element, options) {
		this.element = document.id(element);
		this.setOptions(options);
		this.counter = this.getCounter();
		this.watchAdd();
		this.watchDelete();
	},

	repeatContainers: function () {
		return this.element.getElements('.repeatGroup');
	},

	watchAdd : function () {
		this.element.getElement('a[data-button=addButton]').addEvent('click', function (e) {
			e.stop();
			var div = this.repeatContainers().getLast();
			var newC = this.counter;
			var id = div.id.replace('-' + (newC - 1), '-' + newC);
			var c = new Element('div', {'class': 'repeatGroup', 'id': id}).set('html', div.innerHTML);
			c.inject(div, 'after');
			this.counter++;

			// Update params ids
			if (this.counter !== 0) {
				var chgEvent = new Event('change');
				c.getElements('input, select, textarea, label, button').each(function (i) {
					// Reset all select dropdowns to default for cloned item.
					if (i.get('tag') == 'select') {
						var opt = i.getElement('option');
						if (opt) {
							i.set('value', opt.get('value'));
							i.dispatchEvent(chgEvent);
						}
					}

					// All fabrik elements have ids - if no id we cannot do much.
					if (i.id === '') {
						return;
					}

					var oldId = i.id;
					var a = oldId.split('-');
					a[1] = newC;
					var newId = i.id = a.join('-');

					c.getElements('[for="' + oldId + '"]').each(function (j) {
						j.set('for',newId);
					});

					if (i.name) {
						i.name = this._adjustName(i.name, +1, 0);
					}
					$H(FabrikAdmin.model.fields).each(function (plugins, type) {
						var newPlugin = false;
						if (typeOf(FabrikAdmin.model.fields[type][oldId]) !== 'null') {
							var newPlugin = Object.clone(FabrikAdmin.model.fields[type][oldId]);
							if (newPlugin !== false) {
								newPlugin.cloned(newId, newC);
								FabrikAdmin.model.fields[type][newId] = newPlugin;
							}
						}
					}.bind(this));
				}.bind(this));

				c.getElements('img[src=components/com_fabrik/images/ajax-loader.gif]').each(function (i) {
					var a = i.id.split('-');
					a.pop();
					var newId = i.id = a.join('-') + '-' + this.counter + '_loader';
				}.bind(this));

				// Replace data-showon counters
				this._updateShowon(c, +1, 0);
				FabrikAdmin.reTip();
			}
		}.bind(this));
	},

	getCounter : function () {
		return this.repeatContainers().length;
	},

	watchDelete : function () {
		this.element.getElements('a[data-button=deleteButton]').removeEvents();
		this.element.getElements('a[data-button=deleteButton]').each(function (r, x) {
			r.addEvent('click', function (e) {
				e.stop();
				if (this.getCounter() <= this.options.repeatmin) {
					return;
				}
				var u = this.repeatContainers().getLast();
				document.dispatchEvent(new CustomEvent('fabrikadmin.repeatgroup.remove', {'detail':u}));
				u.destroy();
				this.rename(x);
				this._updateShowon(this.element, -1, x);
			}.bind(this));
		}.bind(this));
	},

	rename : function (x) {
		this.element.getElements('input, select, textarea.FbEditor').each(function (i) {
			i.name = this._adjustName(i.name, -1, x);
		}.bind(this));
	},

	_adjustName: function (n, delta, delIndex) {
		var namebits = n.split('][');
		var i = namebits[2].replace(']', '').toInt();
		if (delta < 0 && (i < 1 || i < delIndex)) {
			return n;
		}
		i += delta;
		if (namebits.length === 3) {
			i = i + ']';
		}
		namebits.splice(2, 1, i);
		return namebits.join('][');
	},

	_updateShowon: function(rg, delta, minIndex) {
		// Replace data-showon counters
		rg.getElements('div[data-showon]').each(function (div) {
			var showon = div.getProperty('data-showon');
			// showon is a string of an array of json.
			try {
				showon = eval(showon);
			}
			catch(error) {
				fconsole('Fabrik repeatgroup: data-showon with incorrect format:', showon);
				return;
			}
			if (!Array.isArray(showon)) {
				fconsole('Fabrik repeatgroup: showon not an array', showon);
				return;
			}
			for (var j = 0; j < showon.length; j++) {
				if (showon[j].hasOwnProperty('field')) {
					showon[j].field = this._adjustName(showon[j].field, delta, minIndex);
				}
			}
			div.setAttribute('data-showon', JSON.stringify(showon));
		}.bind(this));

		if (typeof Joomla.setUpShowon === "function") {
			Joomla.setUpShowon(rg);
		}
	},
});
