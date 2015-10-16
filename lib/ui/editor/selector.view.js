'use strict';

var m = require('mithril');

module.exports = function (scope, parentScope) {
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

  return selectorView;
};
