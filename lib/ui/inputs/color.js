'use strict';

var m = require('mithril');
var number = require('./number');

function getAlpha(color) {
  if (!color || !color.trim().length) {
    return 1;
  }

  if (color.indexOf('rgba')) {
    var parts = color
      .replace('rgba(', '')
      .replace(')', '')
      .split(',');

    return parseFloat(parts.pop());
  }

  return 1;
}

function getColor(color) {
  if (!color || color.indexOf('rgba') === -1) {
    return color || '#000';
  }

  var parts = color.replace('rgba(', '').replace(')', '').split(',');
  parts.pop();

  // todo convert rgb to hex
  return parts.join(',').trim();
}

function withAlpha(color, alpha) {
  if (alpha === 1) {
    return color;
  }

  return 'rgba(' + (color || '#000') + ', ' + alpha + ')';
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.alpha = getAlpha(target[prop]);
      scope.color = getColor(target[prop]);

      scope.set = function (value) {
        scope.color = value;
        target[prop] = withAlpha(value, scope.alpha);
      };

      scope.setAlpha = function (alpha) {
        scope.alpha = alpha;
        scope.set(scope.color);
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('.styler-input-wrapper', [
        m('input.styler-input', {
          type: 'color',
          value: scope.color,
          oninput: m.withAttr('value', scope.set)
        }),

        m('label.styler-input-label', [
          'Alpha',
          m('input.styler-input', {
            type: 'range',
            min: 0, max: 1, step: 0.01,
            value: scope.alpha,
            oninput: m.withAttr('value', scope.setAlpha)
          }),
          ' ', scope.alpha
        ])
      ]);
    }
  };
};
