'use strict';

module.exports = function (selector) {
  var rule = {
    selector: selector || null,
    properties: {}
  };

  rule.toString = function () {
    var str = rule.selector + ' {';
    Object.keys(rule.properties).forEach(function (prop) {
      str += prop + ': ' + rule.properties[prop] + '; ';
    });
    str += ' }';
    return str;
  };

  return rule;
};
