'use strict';

var m = require('mithril');
var utils = require('../../utils');

module.exports = {
  controller: function (parentScope) {

  },
  view: function (scope, parentScope) {
    function elView(el) {
      if (!el) {
        return null;
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
        m('.styler-selection-label' +
          (coords.top < 30 ? '.bottom' : '.top'), utils.getSelector(el))
        : null
      );
    }

    return m('.styler-selection-wrapper', parentScope.editing ?
      parentScope.selection().map(elView) : elView(parentScope.selected)
    );
  }
};
