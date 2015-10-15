'use strict';

var m = require('mithril');
var units = require('./units');

function optionView(unit) {
  return m('option', {
    value: unit
  }, unit);
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.unit = opts.unit || 'px';

      scope.set = function (value) {
        target[prop] = value + scope.unit;
      };

      scope.setUnit = function (unit) {
        scope.unit = unit;
        scope.set(parseFloat(target[prop]));
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('.styler-input-wrapper', [
        m('input.styler-input', {
          type: 'range',
          value: target[prop] || 0,
          min: opts.min || 0,
          max: opts.max || 100,
          step: opts.step || 0.0001,
          oninput: m.withAttr('value', scope.set)
        }),
        m('select.styler-input-unit', {
          value: scope.unit,
          onchange: m.withAttr('value', scope.setUnit)
        }, units.map(optionView))
      ]);
    }
  };
};
