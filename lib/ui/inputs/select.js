'use strict';

var m = require('mithril');

function optionView(value) {
  return m('option', {
    value: value
  }, value);
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.set = function (value) {
        target[prop] = value;
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('select.styler-input', {
        value: target[prop] || '',
        onchange: m.withAttr('value', scope.set)
      }, (opts.options || []).map(optionView));
    }
  };
};
