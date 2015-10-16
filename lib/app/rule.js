'use strict';

module.exports = function (selector) {
  var rule = {
    selector: selector || null,
    properties: {}
  };

  rule.toStyles = function () {
    var styles = {};
    styles[rule.selector] = rule.properties;
    return styles;
  };

  return rule;
};
