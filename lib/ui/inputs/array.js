'use strict';

var m = require('mithril');

module.exports = function (inputs, delimiter) {
  delimiter = delimiter || ' ';

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.values = (target[prop] || '').trim().split(delimiter);

      scope.set = function (value) {
        target[prop] = scope.values.join(delimiter);
      };

      scope.config = function (el, inited) {
        if (inited) {
          return;
        }

        el.addEventListener('oninput', scope.set);
        el.addEventListener('onchange', scope.set);
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('input.styler-input-array', {
        config: scope.config
      }, inputs.map(function (input, index) {
          return m.component(input, scope.values, index);
        })
      );
    }
  };
};
