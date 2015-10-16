'use strict';

var m = require('mithril');
var mc = m.component.bind(m);
var j2c = require('j2c');
var editor = require('../ui/editor');
var header = require('../ui/header');
var selection = require('../ui/selection');
var utils = require('../utils');
var Rule = require('./rule');
var mapObj = require('map-obj');

function trim(value) {
  return value.trim();
}

function isNotEmpty(value) {
  return value;
}

module.exports = function (stylesheet) {
  function controller() {
    var scope = {};
    scope.selected = null;
    scope.editing = false;
    scope.mode = null;
    scope.editMode = null;

    scope.setActiveStylesheet = function (index) {
      scope.stylesheetIndex = index;
    };

    scope.activeStylesheet = function () {
      return scope.stylesheets[scope.stylesheetIndex] || null;
    };

    scope.getStylesheets = function () {
      var sheets = utils.toArray(document.styleSheets);

      return sheets.map(function (sheet, index) {
        return {
          name: sheet.href || sheet.title || 'inline-style ' + (index + 1),
          rules: scope.parseStylesheet(sheet)
        };
      });
    };

    /**
     * Parses stylesheet into an object
     * @param  {CSSStyleSheet} sheet
     * @return {Object}       keys are selector, values properties
     */
    scope.parseStylesheet = function (sheet) {
      // TODO: handle media queries
      var rules = {};

      utils.toArray(sheet.cssRules).forEach(function (cssRule) {
        var text = cssRule.cssText;
        var parts = text.split('{').map(trim);
        var selector = parts.shift();
        parts = parts.join('{').split('}');
        parts.pop();
        var properties = parts.join('}').trim().split(';').map(trim).filter(isNotEmpty);
        var props = {};
        var rule = Rule(selector);

        properties.forEach(function (prop) {
          var parts = prop.split(':');
          var name = parts.shift().trim();
          var value = parts.join(':').trim();
          props[name] = value;
        });

        return rules[selector] = props;
      });

      return rules;
    };

    /**
     * Returns live selection of elements based on current rule's selector
     * @return {Array}
     */
    scope.selection = function () {
      var els = [];

      if (scope.rule && scope.rule.selector) {
        try {
          els = utils.toArray(document.querySelectorAll(scope.rule.selector));
        } catch(e) {
          els = [];
        }
      }

      return els;
    };

    /**
     * updates currently selected element
     * @param  {MouseEvent} event
     */
    scope.updateSelection = function (event) {
      // only update selection if we are in select mode
      // and the currently selected element is different
      if (scope.mode === 'select' && !scope.editing && scope.selected !== event.target && !utils.isWithinStyler(event.target)) {
        scope.selected = event.target;
        m.redraw();
      }
    }

    /**
     * Selects/Deselects an element and toggles the editor
     * @param  {MouseEvent} event
     */
    scope.selectElement = function (event) {
      // do not select if we are not in select mode
      // or if the clicked element is within the styler UI
      if (scope.mode !== 'select' || utils.isWithinStyler(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // deselect if we are currently editing
      // and exit editing
      if (scope.editing) {
        if (!utils.isWithinStyler(event.target)) {
          scope.editing = false;
          m.redraw();

          // after editor is hidden
          // we can erase selection and rule
          utils.later(function () {
            scope.selected = null;
            scope.rule = null;
          }, 500);
        }

        return;
      } else if (scope.mode === 'select' && !utils.isWithinStyler(event.target)) {
        // we clicked on an element outside the styler
        // so use it as selection
        scope.selected = event.target;
        scope.rule = Rule(utils.getSelector(scope.selected));
        scope.editing = true;
        m.redraw();
      }
    }

    scope.applyRule = function () {
      var customStylesheet = scope.stylesheets[scope.stylesheets.length - 1];
      
      // update custom stylesheet
      customStylesheet.rules[scope.rule.selector] = scope.rule.properties;

      var css = j2c.sheet(
        mapObj(customStylesheet.rules, function (key, value) {
          return [key + ' ', value];
        })
      );
      stylesheet.childNodes[0].textContent = css;

      m.redraw();
    };

    scope.setMode = function (mode) {
      if (mode !== scope.mode) {
        scope.mode = mode;

        if (mode === 'select') {
          document.body.addEventListener('mousemove', scope.updateSelection);
          document.body.addEventListener('click', scope.selectElement);
        }

        if (mode === 'navigate') {
          document.body.removeEventListener('mousemove', scope.updateSelection);
          document.body.removeEventListener('click', scope.selectElement);

          scope.selected = null;
          scope.rule = null;
          scope.editing = false;
        }
      }
    };

    scope.setEditMode = function (mode) {
      scope.editMode = mode;
    };

    scope.setSelector = function (selector) {
      var stylesheet = scope.activeStylesheet();

      if (stylesheet.rules[selector]) {
        scope.rule = Rule(selector);
        scope.rule.properties = stylesheet.rules[selector];
      } else {
        scope.rule.selector = selector;
      }
    };

    scope.stylesheets = scope.getStylesheets();
    scope.stylesheetIndex = scope.stylesheets.length - 1;

    scope.setMode('select');
    scope.setEditMode('properties');

    return scope;
  }

  function view(scope) {
    return [
      mc(header, scope),

      scope.selection ?
        mc(editor, scope)
      : null,

      mc(selection, scope)
    ];
  }

  return {
    controller: controller,
    view: view
  };
};
