'use strict';

var m = require('mithril');
var units = require('./units');

function optionView(unit) {
  return m('option', {
    value: unit
  }, unit);
}

function getNumber(value) {
  return parseFloat(value);
}

function getUnit(value) {
  return value.replace(getNumber(value).toString(), '');
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.unit = opts.unit || getUnit(target[prop]) || 'px';
      scope.number = getNumber(target[prop]);

      scope.set = function (value) {
        scope.number = value;
        target[prop] = scope.number + scope.unit;
      };

      scope.setUnit = function (unit) {
        scope.unit = unit;
        scope.set(scope.number);
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('.styler-input-wrapper', [
        m('input.styler-input', {
          type: 'number',
          value: scope.number,
          step: opts.step || 0.0001,
          oninput: m.withAttr('value', scope.set)
        }),
        !opts.unit ?
          m('select.styler-input-unit', {
            value: scope.unit,
            onchange: m.withAttr('value', scope.setUnit)
          }, units.map(optionView))
        : null
      ]);
    }
  };
};
