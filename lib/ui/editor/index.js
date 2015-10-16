'use strict';

var m = require('mithril');
var utils = require('../../utils');
var property = require('./property');
var propertyInputs = require('./property_inputs');
var dashify = require('dashify');

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
      parentScope.rule.properties[prop] = computed[dashify(prop)] || null;
    };

    scope.config = function (el, inited) {
      if (inited) {
        return;
      }

      el.addEventListener('input', parentScope.applyRule);
      el.addEventListener('change', parentScope.applyRule);
    };

    return scope;
  },
  view: function (scope, parentScope) {
    function availableProperties() {
      return Object.keys(propertyInputs.properties)
        .filter(function (prop) {
          return !parentScope.rule.properties[prop];
        });
    }

    function propertyView(prop) {
      return m.component(
        property, parentScope.rule.properties, prop, {
          onRemove: parentScope.applyRule
        }
      );
    }

    function addPropertyView() {
      return m('label.styler-input-label', [
        'Add Property',
        m('select.styler-input.styler-editor-add-property', {
          value: scope.newProperty,
          onchange: m.withAttr('value', scope.addProperty)
        }, [''].concat(availableProperties()).map(function (prop) {
          return m('option', {
            value: prop
          }, dashify(prop));
        }))
      ]);
    }

    function selectorOptionView(selector) {
      return m('option', {
        value: selector
      }, selector);
    }

    function selectorView() {
      return m('label.styler-input-label', [
        'Selector',
        m('input.styler-input.styler-rule-selector', {
          type: 'text',
          value: parentScope.rule.selector,
          oninput: m.withAttr('value', parentScope.setSelector)
        }),
        m('select.styler-input.styler-rule-selector', {
          value: parentScope.rule.selector || '',
          onchange: m.withAttr('value', parentScope.setSelector)
        }, [''].concat(Object.keys(parentScope.activeStylesheet().rules)).map(selectorOptionView))
      ]);
    }

    function propertiesView() {
      return m('section.styler-editor-properties',
        Object.keys(parentScope.rule.properties)
          .map(propertyView)
          .concat(addPropertyView())
      );
    }

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
