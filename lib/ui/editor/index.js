'use strict';

var m = require('mithril');
var utils = require('../../utils');

module.exports = {
  controller: function (parentScope) {
    var scope = {};

    scope.close = function() {
      parentScope.editing = false;
    };

    return scope;
  },
  view: function (scope, parentScope) {
    return m('aside.styler-editor', {
      className: !parentScope.editing ? 'hidden' : ''
    }, [
      m('button.styler-editor-close', {
        onclick: scope.close
      }, 'X'),
      m('h3.styler-editor-selector', utils.getSelector(parentScope.selection))
    ]);
  }
}
