'use strict';

var m = require('mithril');
var property = require('./property');
var propertyInputs = require('./property_inputs');
var dashify = require('dashify');

module.exports = function (scope, parentScope) {
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

  function propertiesView() {
    return m('section.styler-editor-properties',
      Object.keys(parentScope.rule.properties)
        .map(propertyView)
        .concat(addPropertyView())
    );
  }

  return propertiesView;
};
