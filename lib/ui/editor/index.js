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

    scope.setSelector = function(value) {
      parentScope.rule.selector = value;
    };

    scope.addProperty = function (prop) {
      if (!prop) {
        return;
      }
      var computed = window.getComputedStyle(parentScope.selection);
      parentScope.rule.properties[prop] = computed[dashify(prop)] || null;
    };

    scope.config = function (el, inited) {
      if (inited) {
        return;
      }

      el.addEventListener('oninput', parentScope.applyRule);
      el.addEventListener('onchange', parentScope.applyRule);
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
        property, parentScope.rule.properties, prop
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

    return m('aside.styler-editor', {
      config: scope.config,
      className: !parentScope.editing ? 'hidden' : ''
    }, [
      m('button.styler-editor-close', {
        onclick: scope.close
      }, 'X'),
      m('label.styler-input-label', [
        'Selector',
        m('input.styler-input.styler-rule-selector', {
          type: 'text',
          value: parentScope.rule.selector,
          oninput: m.withAttr('value', scope.setSelector)
        })
      ]),
      m('section.styler-editor-properties',
        Object.keys(parentScope.rule.properties)
          .map(propertyView)
          .concat(addPropertyView())
      )
    ]);
  }
}
