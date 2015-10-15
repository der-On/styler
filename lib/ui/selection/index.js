'use strict';

var m = require('mithril');
var utils = require('../../utils');

module.exports = {
  controller: function (parentScope) {

  },
  view: function (scope, parentScope) {
    var el = parentScope.selection;

    if (!el) {
      return  m('.styler-selection.hidden');
    }
    var coords = utils.getCoords(el);
    var width = el.scrollWidth;
    var height = el.scrollHeight;

    return m('.styler-selection', {
      style: {
        top: coords.top + 'px',
        left: coords.left + 'px',
        width: width + 'px',
        height: height + 'px'
      }
    }, !parentScope.editing ?
      m('.styler-selection-label', utils.getSelector(el))
      : null
    );
  }
};
