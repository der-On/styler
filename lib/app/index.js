'use strict';

var m = require('mithril');
var mc = m.component.bind(m);
var j2c = require('j2c');
var editor = require('../ui/editor');
var selection = require('../ui/selection');
var utils = require('../utils');

module.exports = function (stylesheetTextNode) {
  function controller() {
    var scope = {};
    scope.selection = null;
    scope.editing = false;
    scope.navigating = false;

    scope.updateSelection = function (event) {
      if (!scope.navigating && !scope.editing && event.target !== scope.selection && !utils.isWithinStyler(event.target)) {
        scope.selection = event.target;
        m.redraw();
      }
    }

    scope.selectElement = function (event) {
      if (scope.navigating) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (scope.editing) {
        if (!utils.isWithinStyler(event.target)) {
          scope.editing = false;
          m.redraw();

          utils.later(function () {
            scope.selection = null;
          }, 500);
        }

        return;
      }

      if (!utils.isWithinStyler(event.target)) {
        scope.selection = event.target;
        scope.editing = true;
        m.redraw();
      }
    }

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
