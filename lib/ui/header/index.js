'use strict';

var m = require('mithril');
var utils = require('../../utils');

module.exports = {
  controller: function (parentScope) {
    var scope = {};

    document.body.classList.add('-styler-header-visible-');

    scope.onunload = function () {
      document.body.classList.remove('-styler-header-visible-');
    };

    return scope;
  },
  view: function (scope, parentScope) {
    function stylesheetOptionView(sheet, index) {
      return m('option', {
        value: index
      }, sheet.name);
    }

    return m('header.styler-header', [
      'Navigate',
      m('label.styler-input-label', [
        m('input.styler-input', utils.removeEmpty({
          type: 'radio',
          value: 'select',
          checked: parentScope.mode === 'select',
          onclick: m.withAttr('value', parentScope.setMode)
        })),
        ' Select'
      ]),
      m('label.styler-input-label', [
        m('input.styler-input', utils.removeEmpty({
          type: 'radio',
          value: 'navigate',
          checked: parentScope.mode === 'navigate',
          onclick: m.withAttr('value', parentScope.setMode)
        })),
        ' Normal'
      ]),
      ' | ',
      'Edit',
      m('label.styler-input-label', [
        m('input.styler-input', utils.removeEmpty({
          type: 'radio',
          value: 'properties',
          checked: parentScope.editMode === 'properties',
          onclick: m.withAttr('value', parentScope.setEditMode)
        })),
        ' Properties'
      ]),
      m('label.styler-input-label', [
        m('input.styler-input', utils.removeEmpty({
          type: 'radio',
          value: 'source',
          checked: parentScope.editMode === 'source',
          onclick: m.withAttr('value', parentScope.setEditMode)
        })),
        ' Sourcecode'
      ]),
      ' | ',
      m('label.styler-input-label', [
        'Stylesheet',
        m('select.styler-input', {
          value: parentScope.stylesheetIndex,
          onchange: m.withAttr('value', parentScope.setActiveStylesheet)
        }, parentScope.stylesheets.map(stylesheetOptionView))
      ])
    ]);
  }
};
