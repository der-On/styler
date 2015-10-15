'use strict';

var m = require('mithril');

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
      return m('input.styler-input', {
        type: 'text',
        value: target[prop] || '',
        oninput: m.withAttr('value', scope.set)
      });
    }
  };
};
