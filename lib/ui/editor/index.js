'use strict';

var m = require('mithril');
var utils = require('../../utils');
var propertiesView = require('./properties.view');
var selectorView = require('./selector.view');

module.exports = {
  controller: function (parentScope) {
    var scope = {};

    scope.close = function() {
      parentScope.editing = false;
    };

    scope.addProperty = function (prop) {
      if (!prop) {
        return;
      }
      var computed = window.getComputedStyle(parentScope.selected);
      parentScope.rule.properties[prop] = computed[prop] || null;
    };

    scope.config = function (el, inited) {
      if (inited) {
        return;
      }

      el.addEventListener('input', parentScope.applyRule);
      el.addEventListener('change', parentScope.applyRule);
    };

    propertiesView = propertiesView(scope, parentScope);
    selectorView = selectorView(scope, parentScope);

    return scope;
  },
  view: function (scope, parentScope) {
    if (parentScope.editing) {
      document.body.classList.add('-styler-editor-visible-');
    } else {
      document.body.classList.remove('-styler-editor-visible-');
    }

    return m('aside.styler-editor', {
      config: scope.config,
      className: !parentScope.editing ? 'hidden' : ''
    }, [
      m('button.styler-editor-close', {
        onclick: scope.close
      }, 'X'),

      parentScope.rule ?
        selectorView() : null,

      parentScope.rule && parentScope.editMode === 'properties' ?
        propertiesView() : null
    ]);
  }
}
