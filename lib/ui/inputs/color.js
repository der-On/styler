'use strict';

var m = require('mithril');
var number = require('./number');

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function getAlpha(color) {
  if (!color || !color.trim().length) {
    return 1;
  }

  if (color.indexOf('rgba(') !== -1) {
    return color
      .replace('rgba(', '')
      .replace(')', '')
      .split(',').map(parseFloat).pop();
  }

  return 1;
}

function getColor(color) {
  if (!color || color.indexOf('rgb') === -1) {
    return color || '#000000';
  }

  var parts;

  if (color.indexOf('rgba(') !== -1) {
    parts = color.replace('rgba(', '').replace(')', '').split(',').map(parseFloat);
    parts.pop();
  } else if (color.indexOf('rgb(') !== -1) {
    parts = color.replace('rgb(', '').replace(')', '').split(',').map(parseFloat);
  }

  return rgbToHex.apply(null, parts);
}

function withAlpha(color, alpha) {
  if (alpha === 1) {
    return color;
  }

  return 'rgba(' + hexToRgb(color || '#000000').concat(alpha).join(', ') + ')';
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
