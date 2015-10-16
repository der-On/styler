'use strict';

var mapObj = require('map-obj');
var dashify = require('dashify');

function convertProp(key, value) {
  return [dashify(key), value];
}

module.exports = function (selector) {
  var rule = {
    selector: selector || null,
    properties: {}
  };

  rule.toStyles = function () {
    var styles = {};
    styles[rule.selector + ' '] = mapObj(rule.properties, convertProp);
    return styles;
  };

  return rule;
};
