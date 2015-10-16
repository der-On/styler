'use strict';

var m = require('mithril');
var mc = m.component.bind(m);
var j2c = require('j2c');
var editor = require('../ui/editor');
var selection = require('../ui/selection');
var utils = require('../utils');
var rule = require('./rule');

module.exports = function (stylesheetTextNode) {
  function controller() {
    var scope = {};
    scope.selected = null;
    scope.editing = false;
    scope.mode = 'select';
    scope.editMode = 'properties';

    /**
     * Returns live selection of elements based on current rule's selector
     * @return {Array}
     */
    scope.selection = function () {
      var els = [];

      if (scope.rule && scope.rule.selector) {
        try {
          els = Array.prototype.slice.call(document.querySelectorAll(scope.rule.selector));
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
        scope.rule = rule(utils.getSelector(scope.selected));
        scope.editing = true;
        m.redraw();
      }
    }

    scope.rule = rule();

    scope.applyRule = function () {
      stylesheetTextNode.textContent = j2c.sheet(scope.rule.toStyles());
      m.redraw();
    };

    document.body.removeEventListener('mousemove', scope.updateSelection);
    document.body.addEventListener('mousemove', scope.updateSelection);

    document.body.removeEventListener('click', scope.selectElement);
    document.body.addEventListener('click', scope.selectElement);

    return scope;
  }

  function view(scope) {
    return [
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
