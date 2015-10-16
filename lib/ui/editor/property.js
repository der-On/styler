'use strict';

var m = require('mithril');
var propertyInputs = require('./property_inputs');
var dashify = require('dashify');

module.exports = {
  controller: function (target, prop, opts) {
    opts = opts || {};
    var scope = {};

    scope.remove = function (event) {
      delete target[prop];
      event.preventDefault();
      event.stopPropagation();

      if (opts.onRemove) {
        opts.onRemove();
      }
    };

    return scope;
  },
  view: function (scope, target, prop, opts) {
    return m('.styler-rule-property', [
      m('label.styler-rule-property-label', [
        dashify(prop),
        m.component(propertyInputs.getInputFor(prop), target, prop)
      ]),
      m('button.styler-rule-property-remove', {
        onclick: scope.remove
      }, 'X')
    ]);
  }
};
