(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var m = require('mithril');
var j2c = require('j2c');
var app = require('./lib/app');
var uiStyles = j2c.sheet(require('./lib/ui/styles'));

// inject ui stylesheet
var uiStyleSheet = document.createElement('style');
uiStyleSheet.type = 'text/css';
uiStyleSheet.setAttribute('name', 'Styler UI');
uiStyleSheet.appendChild(document.createTextNode(uiStyles));
document.head.appendChild(uiStyleSheet);

// inject stylesheet
var stylesheet = document.createElement('style');
stylesheet.type = 'text/css';
stylesheet.setAttribute('name', 'Overrides');
stylesheet.appendChild(document.createTextNode(''));
document.head.appendChild(stylesheet);

// create main container
var container = document.createElement('div');
container.setAttribute('id', '-styler-root-');
document.body.appendChild(container);

m.mount(container, app(stylesheet));

},{"./lib/app":2,"./lib/ui/styles":22,"j2c":25,"mithril":27}],2:[function(require,module,exports){
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

    /**
     * Sets index of currently active stylesheet
     * @param {Integer} index
     */
    scope.setActiveStylesheet = function (index) {
      scope.stylesheetIndex = index;
    };

    /**
     * Returns the currently active stylesheet
     * @return {Object} { name: '...', rules: { ... } }
     */
    scope.activeStylesheet = function () {
      return scope.stylesheets[scope.stylesheetIndex] || null;
    };

    /**
     * Parses all stylesheets present in the document
     * @return {Array}
     */
    scope.getStylesheets = function () {
      var sheets = utils.toArray(document.styleSheets);

      return sheets.map(function (sheet, index) {
        return {
          name: sheet.href || sheet.title || sheet.ownerNode.getAttribute('name') || 'inline-style ' + (index + 1),
          rules: scope.parseStylesheet(sheet)
        };
      });
    };

    /**
     * Parses stylesheet into an object
     * @param  {CSSStyleSheet} sheet
     * @return {Object}       { name: '...', rules: { ... } }
     */
    scope.parseStylesheet = function (sheet) {
      // TODO: handle media queries
      var rules = {};

      function parseRules() {
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
      }

      try {
        parseRules();
      } catch (err) {
        // ignore this stylesheet. As it's propably an external
      }

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

    /**
     * Applies the currently active style rule to the override stylesheet
     */
    scope.applyRule = function () {
      var customStylesheet = scope.stylesheets[scope.stylesheets.length - 1];

      // update custom stylesheet
      customStylesheet.rules[scope.rule.selector] = scope.rule.properties;

      var css = j2c.sheet(
        mapObj(customStylesheet.rules, function (key, value) {
          return [key + ' ', value];
        })
      );

      stylesheet.innerHTML = css;

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

},{"../ui/editor":4,"../ui/header":10,"../ui/selection":20,"../utils":23,"./rule":3,"j2c":25,"map-obj":26,"mithril":27}],3:[function(require,module,exports){
'use strict';

module.exports = function (selector) {
  var rule = {
    selector: selector || null,
    properties: {}
  };

  rule.toString = function () {
    var str = rule.selector + ' {';
    Object.keys(rule.properties).forEach(function (prop) {
      str += prop + ': ' + rule.properties[prop] + '; ';
    });
    str += ' }';
    return str;
  };

  return rule;
};

},{}],4:[function(require,module,exports){
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

},{"../../utils":23,"./properties.view":5,"./selector.view":8,"mithril":27}],5:[function(require,module,exports){
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

},{"./property":6,"./property_inputs":7,"dashify":24,"mithril":27}],6:[function(require,module,exports){
'use strict';

var m = require('mithril');
var propertyInputs = require('./property_inputs');

module.exports = {
  controller: function (target, prop, opts) {
    opts = opts || {};
    var scope = {};

    scope.remove = function (event) {
      delete target[prop];
      event.preventDefault();
      event.stopPropagation();

      if (opts.onRemove) {
        opts.onRemove();
      }
    };

    return scope;
  },
  view: function (scope, target, prop, opts) {
    return m('.styler-rule-property', [
      m('label.styler-rule-property-label', [
        prop,
        m.component(propertyInputs.getInputFor(prop), target, prop)
      ]),
      m('button.styler-rule-property-remove', {
        onclick: scope.remove
      }, 'X')
    ]);
  }
};

},{"./property_inputs":7,"mithril":27}],7:[function(require,module,exports){
'use strict';

var mapObj = require('map-obj');
var dashify = require('dashify');

var inputs = {
  color: require('../inputs/color'),
  text: require('../inputs/text'),
  url: require('../inputs/url'),
  range: require('../inputs/range'),
  number: require('../inputs/number'),
  select: require('../inputs/select'),
  array: require('../inputs/array')
};

var props = {
  fontSize: inputs.number(),
  fontFamily: inputs.text(),
  fontWeight: inputs.select({
    options: ['normal', 'bold', 'bolder', 'lighter', 100, 200, 300, 400, 500, 600, 700, 800, 900, 'inherit']
  }),
  lineHeight: inputs.number(),

  color: inputs.color(),

  display: inputs.select({
    options: [
      'inline', 'inline-block', 'block', 'none',
      'list-item', 'run-in',
      'table', 'table-caption', 'table-cell', 'table-column', 'table-columns-group', 'table-footer-group', 'table-header-group', 'table-row', 'table-row-group',
      'inherit'
    ]
  }),

  position: inputs.select({
    options: ['static', 'relative', 'absolute', 'fixed', 'inherit']
  }),

  top: inputs.number(),
  right: inputs.number(),
  bottom: inputs.number(),
  left: inputs.number(),

  backgroundColor: inputs.color(),
  backgroundImage: inputs.url(),
  backgroundRepeat: inputs.select({
    options: ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'inherit']
  }),

  backgroundPosition: inputs.array([
    inputs.text(), inputs.text()
  ]),

  paddingTop: inputs.number(),
  paddingRight: inputs.number(),
  paddingBottom: inputs.number(),
  paddingLeft: inputs.number(),

  marginTop: inputs.number(),
  marginRight: inputs.number(),
  marginBottom: inputs.number(),
  marginLeft: inputs.number(),

  borderStyle: inputs.select({
    options: ['none', 'solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset', 'inherit']
  }),
  borderWidth: inputs.number(),
  borderTopWidth: inputs.number(),
  borderRightWidth: inputs.number(),
  borderBottomWidth: inputs.number(),
  borderLeftWidth: inputs.number(),
  borderColor: inputs.color(),
};

props = mapObj(props, function (key, value) {
  return [dashify(key), value];
});

function getInputFor(prop) {
  return props[prop] || inputs.text();
}

module.exports = {
  properties: props,
  inputs: inputs,
  getInputFor: getInputFor
};

},{"../inputs/array":12,"../inputs/color":13,"../inputs/number":14,"../inputs/range":15,"../inputs/select":16,"../inputs/text":17,"../inputs/url":19,"dashify":24,"map-obj":26}],8:[function(require,module,exports){
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

},{"mithril":27}],9:[function(require,module,exports){
'use strict';

module.exports = {
  '.styler-editor': {
    position: 'fixed',
    top: '50px',
    right: 0,
    bottom: 0,
    width: '500px',
    background: '#ddd',
    padding: '10px',
    box_shadow: '0px 0px 5px rgba(0, 0, 0, 0.25)',
    border: '1px solid #bbb',
    transition: 'all 0.5s',
    transform: 'translate(0, 0)',
    z_index: 100000,

    '&.hidden': {
      transform: 'translate(100vw, 0)'
    }
  },
  '.styler-editor-close': {
    position: 'absolute',
    top: '5px',
    right: '5px'
  },
  '.styler-rule-selector': {
    width: '380px',
  },
  '.styler-editor-properties': {
    overflow: 'auto',
    position: 'absolute',
    left: '10px',
    right: '0',
    top: '100px',
    bottom: '10px',
    paddding_right: '10px'
  },
  '.styler-input, .styler-input-unit': {
    border: '1px solid #bbb',
    border_radius: '3px',
    color: '#333',
    padding: '3px',
    background: '#fff'
  },
  '.styler-rule-property, .styler-rule-selector': {
    margin_bottom: '10px'
  },
  '.styler-rule-property-remove': {
    margin_left: '10px'
  },
  '.styler-input-label, .styler-rule-property-label': {
    font_weight: 'bold',

    '& > .styler-input, & > .styler-input-wrapper': {
      margin_left: '10px'
    }
  },
  '.styler-input[type="number"]': {
    max_width: '5em'
  },
  '.styler-input[type="color"]': {
    margin_right: '10px'
  },
  '.styler-input-wrapper': {
    display: 'inline-block'
  }
};

},{}],10:[function(require,module,exports){
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

},{"../../utils":23,"mithril":27}],11:[function(require,module,exports){
'use strict';

module.exports = {
  '.styler-header': {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '10px',
    background: '#ddd',
    box_shadow: '0px 0px 5px rgba(0, 0, 0, 0.25)',
    border: '1px solid #bbb'
  }
};

},{}],12:[function(require,module,exports){
'use strict';

var m = require('mithril');

module.exports = function (inputs, delimiter) {
  delimiter = delimiter || ' ';

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.values = (target[prop] || '').trim().split(delimiter);

      scope.set = function (value) {
        target[prop] = scope.values.join(delimiter);
      };

      scope.config = function (el, inited) {
        if (inited) {
          return;
        }

        el.addEventListener('oninput', scope.set);
        el.addEventListener('onchange', scope.set);
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('input.styler-input-array', {
        config: scope.config
      }, inputs.map(function (input, index) {
          return m.component(input, scope.values, index);
        })
      );
    }
  };
};

},{"mithril":27}],13:[function(require,module,exports){
'use strict';

var m = require('mithril');
var number = require('./number');

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function getAlpha(color) {
  if (!color || !color.trim().length) {
    return 1;
  }

  if (color.indexOf('rgba(') !== -1) {
    return color
      .replace('rgba(', '')
      .replace(')', '')
      .split(',').map(parseFloat).pop();
  }

  return 1;
}

function getColor(color) {
  if (!color || color.indexOf('rgb') === -1) {
    return color || '#000000';
  }

  var parts;

  if (color.indexOf('rgba(') !== -1) {
    parts = color.replace('rgba(', '').replace(')', '').split(',').map(parseFloat);
    parts.pop();
  } else if (color.indexOf('rgb(') !== -1) {
    parts = color.replace('rgb(', '').replace(')', '').split(',').map(parseFloat);
  }

  return rgbToHex.apply(null, parts);
}

function withAlpha(color, alpha) {
  if (alpha === 1) {
    return color;
  }

  return 'rgba(' + hexToRgb(color || '#000000').concat(alpha).join(', ') + ')';
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.alpha = getAlpha(target[prop]);
      scope.color = getColor(target[prop]);

      scope.set = function (value) {
        scope.color = value;
        target[prop] = withAlpha(value, scope.alpha);
      };

      scope.setAlpha = function (alpha) {
        scope.alpha = alpha;
        scope.set(scope.color);
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('.styler-input-wrapper', [
        m('input.styler-input', {
          type: 'color',
          value: scope.color,
          oninput: m.withAttr('value', scope.set)
        }),

        m('label.styler-input-label', [
          'Alpha',
          m('input.styler-input', {
            type: 'range',
            min: 0, max: 1, step: 0.01,
            value: scope.alpha,
            oninput: m.withAttr('value', scope.setAlpha)
          }),
          ' ', scope.alpha
        ])
      ]);
    }
  };
};

},{"./number":14,"mithril":27}],14:[function(require,module,exports){
'use strict';

var m = require('mithril');
var units = require('./units');
var utils = require('../../utils');

function optionView(unit) {
  return m('option', {
    value: unit
  }, unit);
}

function getNumber(value) {
  return parseFloat(value);
}

function getUnit(value) {
  return value.replace(getNumber(value).toString(), '');
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.unit = opts.unit || getUnit(target[prop]) || 'px';
      scope.number = getNumber(target[prop]);

      scope.set = function (value) {
        scope.number = value;
        target[prop] = scope.number + scope.unit;
      };

      scope.setUnit = function (unit) {
        scope.unit = unit;
        scope.set(scope.number);
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('.styler-input-wrapper', [
        m('input.styler-input', utils.removeEmpty({
          type: 'number',
          value: scope.number,
          step: opts.step || false,
          oninput: m.withAttr('value', scope.set)
        })),
        !opts.unit ?
          m('select.styler-input-unit', {
            value: scope.unit,
            onchange: m.withAttr('value', scope.setUnit)
          }, units.map(optionView))
        : null
      ]);
    }
  };
};

},{"../../utils":23,"./units":18,"mithril":27}],15:[function(require,module,exports){
'use strict';

var m = require('mithril');
var units = require('./units');

function optionView(unit) {
  return m('option', {
    value: unit
  }, unit);
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.unit = opts.unit || 'px';

      scope.set = function (value) {
        target[prop] = value + scope.unit;
      };

      scope.setUnit = function (unit) {
        scope.unit = unit;
        scope.set(parseFloat(target[prop]));
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('.styler-input-wrapper', [
        m('input.styler-input', {
          type: 'range',
          value: target[prop] || 0,
          min: opts.min || 0,
          max: opts.max || 100,
          step: opts.step || 0.0001,
          oninput: m.withAttr('value', scope.set)
        }),
        m('select.styler-input-unit', {
          value: scope.unit,
          onchange: m.withAttr('value', scope.setUnit)
        }, units.map(optionView))
      ]);
    }
  };
};

},{"./units":18,"mithril":27}],16:[function(require,module,exports){
'use strict';

var m = require('mithril');

function optionView(value) {
  return m('option', {
    value: value
  }, value);
}

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.set = function (value) {
        target[prop] = value;
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('select.styler-input', {
        value: target[prop] || '',
        onchange: m.withAttr('value', scope.set)
      }, (opts.options || []).map(optionView));
    }
  };
};

},{"mithril":27}],17:[function(require,module,exports){
'use strict';

var m = require('mithril');

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.set = function (value) {
        target[prop] = value;
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('input.styler-input', {
        type: 'text',
        value: target[prop] || '',
        oninput: m.withAttr('value', scope.set)
      });
    }
  };
};

},{"mithril":27}],18:[function(require,module,exports){
'use strict';

module.exports = ['', 'px', 'em', 'rem', '%', 'pt', 'vm', 'vh', 'vmin', 'vmax'];

},{}],19:[function(require,module,exports){
'use strict';

var m = require('mithril');

module.exports = function (opts) {
  opts = opts || {};

  return {
    controller: function (target, prop) {
      var scope = {};

      scope.set = function (value) {
        target[prop] = 'url(' + value + ')';
      };

      return scope;
    },
    view: function (scope, target, prop) {
      return m('input.styler-input', {
        type: 'text',
        value: target[prop] || '',
        oninput: m.withAttr('value', scope.set)
      });
    }
  };
};

},{"mithril":27}],20:[function(require,module,exports){
'use strict';

var m = require('mithril');
var utils = require('../../utils');

module.exports = {
  controller: function (parentScope) {

  },
  view: function (scope, parentScope) {
    function elView(el) {
      if (!el) {
        return null;
      }

      var coords = utils.getCoords(el);
      var width = el.scrollWidth;
      var height = el.scrollHeight;

      return m('.styler-selection', {
        style: {
          top: coords.top + 'px',
          left: coords.left + 'px',
          width: width + 'px',
          height: height + 'px'
        }
      }, !parentScope.editing ?
        m('.styler-selection-label' +
          (coords.top < 30 ? '.bottom' : '.top'), utils.getSelector(el))
        : null
      );
    }

    return m('.styler-selection-wrapper', parentScope.editing ?
      parentScope.selection().map(elView) : elView(parentScope.selected)
    );
  }
};

},{"../../utils":23,"mithril":27}],21:[function(require,module,exports){
'use strict';

module.exports = {
  '.styler-selection ': {
    position: 'absolute',
    border: '2px solid rgba(255, 0, 0, 0.5)',
    box_shadow: '0 0 5px rgba(0,0,0, 0.25)',
    pointer_events: 'none',

    '&.hidden': {
      display: 'none'
    },

    '.styler-selection-label': {
      position: 'absolute',
      left: 0,
      margin_left: '-2px',
      padding: '5px',
      font_size: '11px',
      background: '#ccc',
      white_space: 'nowrap',
      border: '1px solid #bbb',
      box_shadow: '0 0 5px rgba(0,0,0, 0.25)',

      '&.top': {
        bottom: '100%',
        margin_bottom: '2px'
      },
      '&.bottom': {
        top: '100%',
        margin_top: '2px'
      }
    }
  }
};

},{}],22:[function(require,module,exports){
'use strict';

module.exports = {
  '#-styler-root- ': [
    {
      font_family: 'Open Sans, sans',
      font_size: '12px',
      color: '#000',

      '*': {
        box_sizing: 'border-box'
      }
    },

    require('./selection/styles'),
    require('./editor/styles'),
    require('./header/styles')
  ],
  'body.-styler-header-visible-': {
    margin_top: '50px !important'
  },
  'body.-styler-editor-visible-': {
    margin_right: '500px !important'
  }
};

},{"./editor/styles":9,"./header/styles":11,"./selection/styles":21}],23:[function(require,module,exports){
'use strict';

var m = require('mithril');

function getCoords(el) {
  var coords = {
    top: 0, left: 0
  };

  while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
    coords.top += el.offsetTop;
    coords.left += el.offsetLeft;
    el = el.offsetParent;
  }

  return coords;
}

function getSelector(el) {
  var id = el.getAttribute('id') || null;
  var className = el.className || null;
  var selector = el.tagName.toLowerCase() + (id ? '#' + id : '') + (className ? '.' + className.split(' ').join('.') : '');

  if (el.parentElement && el.parentElement.tagName.toLowerCase() !== 'body') {
    selector = getSelector(el.parentElement) + ' > ' + selector;
  }

  return selector;
}

function isWithinStyler(el) {
  var id = el.getAttribute('id');

  if (id && id === '-styler-root-') {
    return true;
  }

  if (el.parentElement) {
    return isWithinStyler(el.parentElement);
  }

  return false;
}

function later(fn, delay) {
  setTimeout(function () {
    m.startComputation();
    fn.apply(null, arguments);
    m.endComputation();
  }, delay);
}

function removeEmpty(obj) {
  var _obj = {};

  Object.keys(obj).forEach(function (key) {
    if (typeof obj[key] === 'undefined' || obj[key] ===false || obj[key] === null) {
      return;
    }

    _obj[key] = obj[key];
  });

  return _obj;
}

function toArray(value) {
  return value ? Array.prototype.slice.call(value) : [];
}

module.exports = {
  getCoords: getCoords,
  getSelector: getSelector,
  isWithinStyler: isWithinStyler,
  later: later,
  removeEmpty: removeEmpty,
  toArray: toArray
};

},{"mithril":27}],24:[function(require,module,exports){
/*!
 * dashify <https://github.com/jonschlinkert/dashify>
 *
 * Copyright (c) 2015 Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function dashify(str) {
  if (typeof str !== 'string') {
    throw new TypeError('dashify expects a string.');
  }
  str = str.replace(/[A-Z]/g, '-$&');
  str = str.replace(/[ \t\W]/g, '-');
  str = str.replace(/^\W+/, '');
  return str.toLowerCase();
};

},{}],25:[function(require,module,exports){
module.exports = (function () {
  var
    empty = [],
    type = ({}).toString,
    own =  ({}).hasOwnProperty,
    OBJECT = type.call({}),
    ARRAY =  type.call(empty),
    STRING = type.call(""),
    scope_root = "_j2c_" + (Math.random() * 1e9 | 0) + "_" + 1 * (new Date()) + "_",
    counter = 0,
    j2c = {};

  // Handles the property:value; pairs.
  // Note that the sheets are built upside down and reversed before being
  // turned into strings.
  function _declarations(o, buf, prefix, vendors, /*var*/ k, v, kk) {
    switch (type.call(o)) {
    case ARRAY:
      for (k = o.length;k--;)
        _declarations(o[k], buf, prefix, vendors);
      break;
    case OBJECT:
      prefix = (prefix && prefix + "-");
      for (k in o) {
        v = o[k];
        if (k.indexOf("$") + 1) {
          // "$" was found.
          for (kk in k = k.split("$").reverse()) if (own.call(k, kk))
            _declarations(v, buf, prefix + k[kk], vendors);
        } else {
          _declarations(v, buf, prefix + k, vendors);
        }
      }
      break;
    default:
      // prefix is falsy when it is "", which means that we're
      // at the top level.
      // `o` is then treated as a `property:value` pair.
      // otherwise, `prefix` is the property name, and
      // `o` is the value.
      buf.push(o = (prefix && (prefix).replace(/_/g, "-") + ":") + o + ";");
      // vendorify
      for (k = vendors.length; k--;)
         buf.push("-" + vendors[k] + "-" + o);
    }
  }


  

  /*/-statements-/*/
  function _cartesian(a,b, selectorP, res, i, j) {
    res = [];
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(_concat(a[i], b[j], selectorP));
    return res;
  }

  function _concat(a, b, selectorP) {
    return selectorP && b.indexOf("&") + 1 ? b.replace(/&/g, a) : a + b
  }


  // Add rulesets and other CSS statements to the sheet.
  function _add(statements, buf, prefix, vendors, /*var*/ k, v, decl) {
    // optionally needed in the "[object String]" case
    // where the `statements` variable actually holds
    // declaratons. This allows to process either a 
    // string or a declarations object with the same code.
    decl = statements

    switch (type.call(statements)) {

    case ARRAY:
      for (k = statements.length;k--;)
        _add(statements[k], buf, prefix, vendors);
      break;

    case OBJECT:
      decl = {};
      for (k in statements) if (k[0] == "@") { // Handle At-rules
        v = statements[k];

        if (type.call(v) == STRING) {
          buf.push(k + " " + v + ";");

        } else if (k.match(/^@keyframes /)) {
          buf.push("}");
          _add(v, buf, "", vendors);
          buf.push(k + "{");

          // add a @-webkit-keyframes block too.
          buf.push("}");
          _add(v, buf, "", ["webkit"]);
          buf.push("@-webkit-" + k.slice(1) + "{");

        } else if (k.match(/^@font-face/)) {
          _add(v, buf, k, empty)

        } else { 
          // default @-rule (usually @media)
          buf.push("}");
          _add(v, buf, prefix, vendors);
          buf.push(k + "{");
        }
      }
      for (k in statements) {
        v = statements[k];
        if (k.match(/^[-\w$]+$/)) {
          // It is a declaration.
          decl[k] = v;

        } else if (k[0] != "@") {
          // nested sub-selectors
          _add(v, buf,
            /* if prefix and/or k have a coma */
              prefix.indexOf(",") + k.indexOf(",") + 2 ?
            /* then */
              _cartesian(prefix.split(","), k.split(","), 1).join(",") :
            /* else */
              _concat(prefix, k, 1)
            ,
            vendors
          );
        }
      }
  
      // fall through for handling declarations.

    case STRING:
      // fake loop to detect the presence of declarations.
      // runs if decl is a non-empty string or when falling
      // through from the `Object` case, when there are
      // declarations.
      for (k in decl) if (own.call(decl, k)){
        buf.push("}");
        _declarations(decl, buf, "", vendors);
        buf.push((prefix || "*") + "{");
        break;
      }
    }
  }

  function _finalize(buf) {return buf.reverse().join("\n");}

  j2c.inline = function (o, vendors, buf) {
    _declarations(o, buf = [], "", vendors || empty);
    return _finalize(buf);
  }

  j2c.sheet = function (statements, vendors, buf) {
    _add(statements, buf = [], "", vendors || empty);
    return _finalize(buf);
  };

  j2c.scoped = function(statements, vendors, k) {
    var classes = {},
        buf = [];
    vendors = vendors || empty;
    for (k in statements) if (own.call(statements, k)) {
      classes[k] = k.replace(/[^\-\w]/, '') + scope_root + (counter++);
      _add(statements[k], buf, "." + classes[k], vendors);
    }
    buf = new String(_finalize(buf));
    for (k in statements) if (own.call(statements, k)) buf[k] = classes[k];
    return buf;
  }
  /*/-statements-/*/

  j2c.prefix = function(val, vendors) {
    return _cartesian(
      vendors.map(function(p){return "-"+p+"-"}).concat([""]),
      [val]
    );
  };
  return j2c;
})()

/*
Copyright © 2015 Pierre-Yves Gérardy

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the “Software”),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/;
},{}],26:[function(require,module,exports){
'use strict';
module.exports = function (obj, cb) {
	var ret = {};
	var keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var res = cb(key, obj[key], obj);
		ret[res[0]] = res[1];
	}

	return ret;
};

},{}],27:[function(require,module,exports){
var m = (function app(window, undefined) {
	var OBJECT = "[object Object]", ARRAY = "[object Array]", STRING = "[object String]", FUNCTION = "function";
	var type = {}.toString;
	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
	var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
	var noop = function() {}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

	// self invoking function needed because of the way mocks work
	function initialize(window){
		$document = window.document;
		$location = window.location;
		$cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
		$requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
	}

	initialize(window);


	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
	 *
	 */
	function m() {
		var args = [].slice.call(arguments);
		var hasAttrs = args[1] != null && type.call(args[1]) === OBJECT && !("tag" in args[1] || "view" in args[1]) && !("subtree" in args[1]);
		var attrs = hasAttrs ? args[1] : {};
		var classAttrName = "class" in attrs ? "class" : "className";
		var cell = {tag: "div", attrs: {}};
		var match, classes = [];
		if (type.call(args[0]) != STRING) throw new Error("selector in m(selector, attrs, children) should be a string")
		while (match = parser.exec(args[0])) {
			if (match[1] === "" && match[2]) cell.tag = match[2];
			else if (match[1] === "#") cell.attrs.id = match[2];
			else if (match[1] === ".") classes.push(match[2]);
			else if (match[3][0] === "[") {
				var pair = attrParser.exec(match[3]);
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true)
			}
		}

		var children = hasAttrs ? args.slice(2) : args.slice(1);
		if (children.length === 1 && type.call(children[0]) === ARRAY) {
			cell.children = children[0]
		}
		else {
			cell.children = children
		}
		
		for (var attrName in attrs) {
			if (attrs.hasOwnProperty(attrName)) {
				if (attrName === classAttrName && attrs[attrName] != null && attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					cell.attrs[attrName] = "" //create key in correct iteration order
				}
				else cell.attrs[attrName] = attrs[attrName]
			}
		}
		if (classes.length > 0) cell.attrs[classAttrName] = classes.join(" ");
		
		return cell
	}
	function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
		//`build` is a recursive function that manages creation/diffing/removal of DOM elements based on comparison between `data` and `cached`
		//the diff algorithm can be summarized as this:
		//1 - compare `data` and `cached`
		//2 - if they are different, copy `data` to `cached` and update the DOM based on what the difference is
		//3 - recursively apply this algorithm for every array and for the children of every virtual element

		//the `cached` data structure is essentially the same as the previous redraw's `data` data structure, with a few additions:
		//- `cached` always has a property called `nodes`, which is a list of DOM elements that correspond to the data represented by the respective virtual element
		//- in order to support attaching `nodes` as a property of `cached`, `cached` is *always* a non-primitive object, i.e. if the data was a string, then cached is a String instance. If data was `null` or `undefined`, cached is `new String("")`
		//- `cached also has a `configContext` property, which is the state storage object exposed by config(element, isInitialized, context)
		//- when `cached` is an Object, it represents a virtual element; when it's an Array, it represents a list of elements; when it's a String, Number or Boolean, it represents a text node

		//`parentElement` is a DOM element used for W3C DOM API calls
		//`parentTag` is only used for handling a corner case for textarea values
		//`parentCache` is used to remove nodes in some multi-node cases
		//`parentIndex` and `index` are used to figure out the offset of nodes. They're artifacts from before arrays started being flattened and are likely refactorable
		//`data` and `cached` are, respectively, the new and old nodes being diffed
		//`shouldReattach` is a flag indicating whether a parent node was recreated (if so, and if this node is reused, then this node must reattach itself to the new parent)
		//`editable` is a flag that indicates whether an ancestor is contenteditable
		//`namespace` indicates the closest HTML namespace as it cascades down from an ancestor
		//`configs` is a list of config functions to run after the topmost `build` call finishes running

		//there's logic that relies on the assumption that null and undefined data are equivalent to empty strings
		//- this prevents lifecycle surprises from procedural helpers that mix implicit and explicit return statements (e.g. function foo() {if (cond) return m("div")}
		//- it simplifies diffing code
		//data.toString() might throw or return null if data is the return value of Console.log in Firefox (behavior depends on version)
		try {if (data == null || data.toString() == null) data = "";} catch (e) {data = ""}
		if (data.subtree === "retain") return cached;
		var cachedType = type.call(cached), dataType = type.call(data);
		if (cached == null || cachedType !== dataType) {
			if (cached != null) {
				if (parentCache && parentCache.nodes) {
					var offset = index - parentIndex;
					var end = offset + (dataType === ARRAY ? data : cached.nodes).length;
					clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end))
				}
				else if (cached.nodes) clear(cached.nodes, cached)
			}
			cached = new data.constructor;
			if (cached.tag) cached = {}; //if constructor creates a virtual dom element, use a blank object as the base cached node instead of copying the virtual el (#277)
			cached.nodes = []
		}

		if (dataType === ARRAY) {
			//recursively flatten array
			for (var i = 0, len = data.length; i < len; i++) {
				if (type.call(data[i]) === ARRAY) {
					data = data.concat.apply([], data);
					i-- //check current index again and flatten until there are no more nested arrays at that index
					len = data.length
				}
			}
			
			var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

			//keys algorithm: sort elements without recreating them if keys are present
			//1) create a map of all existing keys, and mark all for deletion
			//2) add new keys to map and mark them for addition
			//3) if key exists in new list, change action from deletion to a move
			//4) for each key, handle its corresponding action as marked in previous steps
			var DELETION = 1, INSERTION = 2 , MOVE = 3;
			var existing = {}, shouldMaintainIdentities = false;
			for (var i = 0; i < cached.length; i++) {
				if (cached[i] && cached[i].attrs && cached[i].attrs.key != null) {
					shouldMaintainIdentities = true;
					existing[cached[i].attrs.key] = {action: DELETION, index: i}
				}
			}
			
			var guid = 0
			for (var i = 0, len = data.length; i < len; i++) {
				if (data[i] && data[i].attrs && data[i].attrs.key != null) {
					for (var j = 0, len = data.length; j < len; j++) {
						if (data[j] && data[j].attrs && data[j].attrs.key == null) data[j].attrs.key = "__mithril__" + guid++
					}
					break
				}
			}
			
			if (shouldMaintainIdentities) {
				var keysDiffer = false
				if (data.length != cached.length) keysDiffer = true
				else for (var i = 0, cachedCell, dataCell; cachedCell = cached[i], dataCell = data[i]; i++) {
					if (cachedCell.attrs && dataCell.attrs && cachedCell.attrs.key != dataCell.attrs.key) {
						keysDiffer = true
						break
					}
				}
				
				if (keysDiffer) {
					for (var i = 0, len = data.length; i < len; i++) {
						if (data[i] && data[i].attrs) {
							if (data[i].attrs.key != null) {
								var key = data[i].attrs.key;
								if (!existing[key]) existing[key] = {action: INSERTION, index: i};
								else existing[key] = {
									action: MOVE,
									index: i,
									from: existing[key].index,
									element: cached.nodes[existing[key].index] || $document.createElement("div")
								}
							}
						}
					}
					var actions = []
					for (var prop in existing) actions.push(existing[prop])
					var changes = actions.sort(sortChanges);
					var newCached = new Array(cached.length)
					newCached.nodes = cached.nodes.slice()

					for (var i = 0, change; change = changes[i]; i++) {
						if (change.action === DELETION) {
							clear(cached[change.index].nodes, cached[change.index]);
							newCached.splice(change.index, 1)
						}
						if (change.action === INSERTION) {
							var dummy = $document.createElement("div");
							dummy.key = data[change.index].attrs.key;
							parentElement.insertBefore(dummy, parentElement.childNodes[change.index] || null);
							newCached.splice(change.index, 0, {attrs: {key: data[change.index].attrs.key}, nodes: [dummy]})
							newCached.nodes[change.index] = dummy
						}

						if (change.action === MOVE) {
							if (parentElement.childNodes[change.index] !== change.element && change.element !== null) {
								parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null)
							}
							newCached[change.index] = cached[change.from]
							newCached.nodes[change.index] = change.element
						}
					}
					cached = newCached;
				}
			}
			//end key algorithm

			for (var i = 0, cacheCount = 0, len = data.length; i < len; i++) {
				//diff each item in the array
				var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);
				if (item === undefined) continue;
				if (!item.nodes.intact) intact = false;
				if (item.$trusted) {
					//fix offset of next element if item was a trusted string w/ more than one html element
					//the first clause in the regexp matches elements
					//the second clause (after the pipe) matches text nodes
					subArrayCount += (item.match(/<[^\/]|\>\s*[^<]/g) || [0]).length
				}
				else subArrayCount += type.call(item) === ARRAY ? item.length : 1;
				cached[cacheCount++] = item
			}
			if (!intact) {
				//diff the array itself
				
				//update the list of DOM nodes by collecting the nodes from each item
				for (var i = 0, len = data.length; i < len; i++) {
					if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
				}
				//remove items from the end of the array if the new array is shorter than the old one
				//if errors ever happen here, the issue is most likely a bug in the construction of the `cached` data structure somewhere earlier in the program
				for (var i = 0, node; node = cached.nodes[i]; i++) {
					if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]])
				}
				if (data.length < cached.length) cached.length = data.length;
				cached.nodes = nodes
			}
		}
		else if (data != null && dataType === OBJECT) {
			var views = [], controllers = []
			while (data.view) {
				var view = data.view.$original || data.view
				var controllerIndex = m.redraw.strategy() == "diff" && cached.views ? cached.views.indexOf(view) : -1
				var controller = controllerIndex > -1 ? cached.controllers[controllerIndex] : new (data.controller || noop)
				var key = data && data.attrs && data.attrs.key
				data = pendingRequests == 0 || (cached && cached.controllers && cached.controllers.indexOf(controller) > -1) ? data.view(controller) : {tag: "placeholder"}
				if (data.subtree === "retain") return cached;
				if (key) {
					if (!data.attrs) data.attrs = {}
					data.attrs.key = key
				}
				if (controller.onunload) unloaders.push({controller: controller, handler: controller.onunload})
				views.push(view)
				controllers.push(controller)
			}
			if (!data.tag && controllers.length) throw new Error("Component template must return a virtual element, not an array, string, etc.")
			if (!data.attrs) data.attrs = {};
			if (!cached.attrs) cached.attrs = {};

			var dataAttrKeys = Object.keys(data.attrs)
			var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)
			//if an element is different enough from the one in cache, recreate it
			if (data.tag != cached.tag || dataAttrKeys.sort().join() != Object.keys(cached.attrs).sort().join() || data.attrs.id != cached.attrs.id || data.attrs.key != cached.attrs.key || (m.redraw.strategy() == "all" && (!cached.configContext || cached.configContext.retain !== true)) || (m.redraw.strategy() == "diff" && cached.configContext && cached.configContext.retain === false)) {
				if (cached.nodes.length) clear(cached.nodes);
				if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) cached.configContext.onunload()
				if (cached.controllers) {
					for (var i = 0, controller; controller = cached.controllers[i]; i++) {
						if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop})
					}
				}
			}
			if (type.call(data.tag) != STRING) return;

			var node, isNew = cached.nodes.length === 0;
			if (data.attrs.xmlns) namespace = data.attrs.xmlns;
			else if (data.tag === "svg") namespace = "http://www.w3.org/2000/svg";
			else if (data.tag === "math") namespace = "http://www.w3.org/1998/Math/MathML";
			
			if (isNew) {
				if (data.attrs.is) node = namespace === undefined ? $document.createElement(data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag, data.attrs.is);
				else node = namespace === undefined ? $document.createElement(data.tag) : $document.createElementNS(namespace, data.tag);
				cached = {
					tag: data.tag,
					//set attributes first, then create children
					attrs: hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs,
					children: data.children != null && data.children.length > 0 ?
						build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
						data.children,
					nodes: [node]
				};
				if (controllers.length) {
					cached.views = views
					cached.controllers = controllers
					for (var i = 0, controller; controller = controllers[i]; i++) {
						if (controller.onunload && controller.onunload.$old) controller.onunload = controller.onunload.$old
						if (pendingRequests && controller.onunload) {
							var onunload = controller.onunload
							controller.onunload = noop
							controller.onunload.$old = onunload
						}
					}
				}
				
				if (cached.children && !cached.children.nodes) cached.children.nodes = [];
				//edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
				if (data.tag === "select" && "value" in data.attrs) setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
				parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			else {
				node = cached.nodes[0];
				if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
				cached.children = build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
				cached.nodes.intact = true;
				if (controllers.length) {
					cached.views = views
					cached.controllers = controllers
				}
				if (shouldReattach === true && node != null) parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			//schedule configs to be called. They are called after `build` finishes running
			if (typeof data.attrs["config"] === FUNCTION) {
				var context = cached.configContext = cached.configContext || {};

				// bind
				var callback = function(data, args) {
					return function() {
						return data.attrs["config"].apply(data, args)
					}
				};
				configs.push(callback(data, [node, !isNew, context, cached]))
			}
		}
		else if (typeof data != FUNCTION) {
			//handle text nodes
			var nodes;
			if (cached.nodes.length === 0) {
				if (data.$trusted) {
					nodes = injectHTML(parentElement, index, data)
				}
				else {
					nodes = [$document.createTextNode(data)];
					if (!parentElement.nodeName.match(voidElements)) parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
				}
				cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data;
				cached.nodes = nodes
			}
			else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
				nodes = cached.nodes;
				if (!editable || editable !== $document.activeElement) {
					if (data.$trusted) {
						clear(nodes, cached);
						nodes = injectHTML(parentElement, index, data)
					}
					else {
						//corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
						//we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
						if (parentTag === "textarea") parentElement.value = data;
						else if (editable) editable.innerHTML = data;
						else {
							if (nodes[0].nodeType === 1 || nodes.length > 1) { //was a trusted string
								clear(cached.nodes, cached);
								nodes = [$document.createTextNode(data)]
							}
							parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null);
							nodes[0].nodeValue = data
						}
					}
				}
				cached = new data.constructor(data);
				cached.nodes = nodes
			}
			else cached.nodes.intact = true
		}

		return cached
	}
	function sortChanges(a, b) {return a.action - b.action || a.index - b.index}
	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			var dataAttr = dataAttrs[attrName];
			var cachedAttr = cachedAttrs[attrName];
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
				cachedAttrs[attrName] = dataAttr;
				try {
					//`config` isn't a real attributes, so ignore it
					if (attrName === "config" || attrName == "key") continue;
					//hook event handlers to the auto-redrawing system
					else if (typeof dataAttr === FUNCTION && attrName.indexOf("on") === 0) {
						node[attrName] = autoredraw(dataAttr, node)
					}
					//handle `style: {...}`
					else if (attrName === "style" && dataAttr != null && type.call(dataAttr) === OBJECT) {
						for (var rule in dataAttr) {
							if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule]
						}
						for (var rule in cachedAttr) {
							if (!(rule in dataAttr)) node.style[rule] = ""
						}
					}
					//handle SVG
					else if (namespace != null) {
						if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
						else if (attrName === "className") node.setAttribute("class", dataAttr);
						else node.setAttribute(attrName, dataAttr)
					}
					//handle cases that are properties (but ignore cases where we should use setAttribute instead)
					//- list and form are typically used as strings, but are DOM element references in js
					//- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
					else if (attrName in node && !(attrName === "list" || attrName === "style" || attrName === "form" || attrName === "type" || attrName === "width" || attrName === "height")) {
						//#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
						if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr
					}
					else node.setAttribute(attrName, dataAttr)
				}
				catch (e) {
					//swallow IE's invalid argument errors to mimic HTML's fallback-to-doing-nothing-on-invalid-attributes behavior
					if (e.message.indexOf("Invalid argument") < 0) throw e
				}
			}
			//#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
			else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
				node.value = dataAttr
			}
		}
		return cachedAttrs
	}
	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {nodes[i].parentNode.removeChild(nodes[i])}
				catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
				cached = [].concat(cached);
				if (cached[i]) unload(cached[i])
			}
		}
		if (nodes.length != 0) nodes.length = 0
	}
	function unload(cached) {
		if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) {
			cached.configContext.onunload();
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			for (var i = 0, controller; controller = cached.controllers[i]; i++) {
				if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop});
			}
		}
		if (cached.children) {
			if (type.call(cached.children) === ARRAY) {
				for (var i = 0, child; child = cached.children[i]; i++) unload(child)
			}
			else if (cached.children.tag) unload(cached.children)
		}
	}
	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index];
		if (nextSibling) {
			var isElement = nextSibling.nodeType != 1;
			var placeholder = $document.createElement("span");
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null);
				placeholder.insertAdjacentHTML("beforebegin", data);
				parentElement.removeChild(placeholder)
			}
			else nextSibling.insertAdjacentHTML("beforebegin", data)
		}
		else parentElement.insertAdjacentHTML("beforeend", data);
		var nodes = [];
		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index]);
			index++
		}
		return nodes
	}
	function autoredraw(callback, object) {
		return function(e) {
			e = e || event;
			m.redraw.strategy("diff");
			m.startComputation();
			try {return callback.call(object, e)}
			finally {
				endFirstComputation()
			}
		}
	}

	var html;
	var documentNode = {
		appendChild: function(node) {
			if (html === undefined) html = $document.createElement("html");
			if ($document.documentElement && $document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			}
			else $document.appendChild(node);
			this.childNodes = $document.childNodes
		},
		insertBefore: function(node) {
			this.appendChild(node)
		},
		childNodes: []
	};
	var nodeCache = [], cellCache = {};
	m.render = function(root, cell, forceRecreation) {
		var configs = [];
		if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
		var id = getCellCacheKey(root);
		var isDocumentRoot = root === $document;
		var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
		if (isDocumentRoot && cell.tag != "html") cell = {tag: "html", attrs: {}, children: cell};
		if (cellCache[id] === undefined) clear(node.childNodes);
		if (forceRecreation === true) reset(root);
		cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
		for (var i = 0, len = configs.length; i < len; i++) configs[i]()
	};
	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element);
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function(value) {
		value = new String(value);
		value.$trusted = true;
		return value
	};

	function gettersetter(store) {
		var prop = function() {
			if (arguments.length) store = arguments[0];
			return store
		};

		prop.toJSON = function() {
			return store
		};

		return prop
	}

	m.prop = function (store) {
		//note: using non-strict equality check here because we're checking if store is null OR undefined
		if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
			return propify(store)
		}

		return gettersetter(store)
	};

	var roots = [], components = [], controllers = [], lastRedrawId = null, lastRedrawCallTime = 0, computePreRedrawHook = null, computePostRedrawHook = null, prevented = false, topComponent, unloaders = [];
	var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
	function parameterize(component, args) {
		var controller = function() {
			return (component.controller || noop).apply(this, args) || this
		}
		var view = function(ctrl) {
			if (arguments.length > 1) args = args.concat([].slice.call(arguments, 1))
			return component.view.apply(component, args ? [ctrl].concat(args) : [ctrl])
		}
		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}
	m.component = function(component) {
		return parameterize(component, [].slice.call(arguments, 1))
	}
	m.mount = m.module = function(root, component) {
		if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
		var index = roots.indexOf(root);
		if (index < 0) index = roots.length;
		
		var isPrevented = false;
		var event = {preventDefault: function() {
			isPrevented = true;
			computePreRedrawHook = computePostRedrawHook = null;
		}};
		for (var i = 0, unloader; unloader = unloaders[i]; i++) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		}
		if (isPrevented) {
			for (var i = 0, unloader; unloader = unloaders[i]; i++) unloader.controller.onunload = unloader.handler
		}
		else unloaders = []
		
		if (controllers[index] && typeof controllers[index].onunload === FUNCTION) {
			controllers[index].onunload(event)
		}
		
		if (!isPrevented) {
			m.redraw.strategy("all");
			m.startComputation();
			roots[index] = root;
			if (arguments.length > 2) component = subcomponent(component, [].slice.call(arguments, 2))
			var currentComponent = topComponent = component = component || {controller: function() {}};
			var constructor = component.controller || noop
			var controller = new constructor;
			//controllers may call m.mount recursively (via m.route redirects, for example)
			//this conditional ensures only the last recursive m.mount call is applied
			if (currentComponent === topComponent) {
				controllers[index] = controller;
				components[index] = component
			}
			endFirstComputation();
			return controllers[index]
		}
	};
	var redrawing = false
	m.redraw = function(force) {
		if (redrawing) return
		redrawing = true
		//lastRedrawId is a positive number if a second redraw is requested before the next animation frame
		//lastRedrawID is null if it's the first redraw and not an event handler
		if (lastRedrawId && force !== true) {
			//when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
			//when rAF: always reschedule redraw
			if ($requestAnimationFrame === window.requestAnimationFrame || new Date - lastRedrawCallTime > FRAME_BUDGET) {
				if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
				lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
			}
		}
		else {
			redraw();
			lastRedrawId = $requestAnimationFrame(function() {lastRedrawId = null}, FRAME_BUDGET)
		}
		redrawing = false
	};
	m.redraw.strategy = m.prop();
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		for (var i = 0, root; root = roots[i]; i++) {
			if (controllers[i]) {
				var args = components[i].controller && components[i].controller.$$args ? [controllers[i]].concat(components[i].controller.$$args) : [controllers[i]]
				m.render(root, components[i].view ? components[i].view(controllers[i], args) : "")
			}
		}
		//after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook();
			computePostRedrawHook = null
		}
		lastRedrawId = null;
		lastRedrawCallTime = new Date;
		m.redraw.strategy("diff")
	}

	var pendingRequests = 0;
	m.startComputation = function() {pendingRequests++};
	m.endComputation = function() {
		pendingRequests = Math.max(pendingRequests - 1, 0);
		if (pendingRequests === 0) m.redraw()
	};
	var endFirstComputation = function() {
		if (m.redraw.strategy() == "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		}
		else m.endComputation();
	}

	m.withAttr = function(prop, withAttrCallback) {
		return function(e) {
			e = e || event;
			var currentTarget = e.currentTarget || this;
			withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
		}
	};

	//routing
	var modes = {pathname: "", hash: "#", search: "?"};
	var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;
	m.route = function() {
		//m.route()
		if (arguments.length === 0) return currentRoute;
		//m.route(el, defaultRoute, routes)
		else if (arguments.length === 3 && type.call(arguments[1]) === STRING) {
			var root = arguments[0], defaultRoute = arguments[1], router = arguments[2];
			redirect = function(source) {
				var path = currentRoute = normalizeRoute(source);
				if (!routeByValue(root, router, path)) {
					if (isDefaultRoute) throw new Error("Ensure the default route matches one of the routes defined in m.route")
					isDefaultRoute = true
					m.route(defaultRoute, true)
					isDefaultRoute = false
				}
			};
			var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
			window[listener] = function() {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute != normalizeRoute(path)) {
					redirect(path)
				}
			};
			computePreRedrawHook = setScroll;
			window[listener]()
		}
		//config: m.route
		else if (arguments[0].addEventListener || arguments[0].attachEvent) {
			var element = arguments[0];
			var isInitialized = arguments[1];
			var context = arguments[2];
			var vdom = arguments[3];
			element.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + vdom.attrs.href;
			if (element.addEventListener) {
				element.removeEventListener("click", routeUnobtrusive);
				element.addEventListener("click", routeUnobtrusive)
			}
			else {
				element.detachEvent("onclick", routeUnobtrusive);
				element.attachEvent("onclick", routeUnobtrusive)
			}
		}
		//m.route(route, params, shouldReplaceHistoryEntry)
		else if (type.call(arguments[0]) === STRING) {
			var oldRoute = currentRoute;
			currentRoute = arguments[0];
			var args = arguments[1] || {}
			var queryIndex = currentRoute.indexOf("?")
			var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {}
			for (var i in args) params[i] = args[i]
			var querystring = buildQueryString(params)
			var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute
			if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

			var shouldReplaceHistoryEntry = (arguments.length === 3 ? arguments[2] : arguments[1]) === true || oldRoute === arguments[0];

			if (window.history.pushState) {
				computePreRedrawHook = setScroll
				computePostRedrawHook = function() {
					window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
				};
				redirect(modes[m.route.mode] + currentRoute)
			}
			else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}
		}
	};
	m.route.param = function(key) {
		if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()")
		return routeParams[key]
	};
	m.route.mode = "search";
	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}
	function routeByValue(root, router, path) {
		routeParams = {};

		var queryStart = path.indexOf("?");
		if (queryStart !== -1) {
			routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router);
		var index = keys.indexOf(path);
		if(index !== -1){
			m.mount(root, router[keys [index]]);
			return true;
		}

		for (var route in router) {
			if (route === path) {
				m.mount(root, router[route]);
				return true
			}

			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

			if (matcher.test(path)) {
				path.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || [];
					var values = [].slice.call(arguments, 1, -2);
					for (var i = 0, len = keys.length; i < len; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
					m.mount(root, router[route])
				});
				return true
			}
		}
	}
	function routeUnobtrusive(e) {
		e = e || event;
		if (e.ctrlKey || e.metaKey || e.which === 2) return;
		if (e.preventDefault) e.preventDefault();
		else e.returnValue = false;
		var currentTarget = e.currentTarget || e.srcElement;
		var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
		while (currentTarget && currentTarget.nodeName.toUpperCase() != "A") currentTarget = currentTarget.parentNode
		m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args)
	}
	function setScroll() {
		if (m.route.mode != "hash" && $location.hash) $location.hash = $location.hash;
		else window.scrollTo(0, 0)
	}
	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []
		for (var prop in object) {
			var key = prefix ? prefix + "[" + prop + "]" : prop
			var value = object[prop]
			var valueType = type.call(value)
			var pair = (value === null) ? encodeURIComponent(key) :
				valueType === OBJECT ? buildQueryString(value, key) :
				valueType === ARRAY ? value.reduce(function(memo, item) {
					if (!duplicates[key]) duplicates[key] = {}
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						return memo.concat(encodeURIComponent(key) + "=" + encodeURIComponent(item))
					}
					return memo
				}, []).join("&") :
				encodeURIComponent(key) + "=" + encodeURIComponent(value)
			if (value !== undefined) str.push(pair)
		}
		return str.join("&")
	}
	function parseQueryString(str) {
		if (str.charAt(0) === "?") str = str.substring(1);
		
		var pairs = str.split("&"), params = {};
		for (var i = 0, len = pairs.length; i < len; i++) {
			var pair = pairs[i].split("=");
			var key = decodeURIComponent(pair[0])
			var value = pair.length == 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (type.call(params[key]) !== ARRAY) params[key] = [params[key]]
				params[key].push(value)
			}
			else params[key] = value
		}
		return params
	}
	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString
	
	function reset(root) {
		var cacheKey = getCellCacheKey(root);
		clear(root.childNodes, cellCache[cacheKey]);
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred();
		deferred.promise = propify(deferred.promise);
		return deferred
	};
	function propify(promise, initialValue) {
		var prop = m.prop(initialValue);
		promise.then(prop);
		prop.then = function(resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		};
		return prop
	}
	//Promiz.mithril.js | Zolmeister | MIT
	//a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
	//1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
	//2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
	function Deferred(successCallback, failureCallback) {
		var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
		var self = this, state = 0, promiseValue = 0, next = [];

		self["promise"] = {};

		self["resolve"] = function(value) {
			if (!state) {
				promiseValue = value;
				state = RESOLVING;

				fire()
			}
			return this
		};

		self["reject"] = function(value) {
			if (!state) {
				promiseValue = value;
				state = REJECTING;

				fire()
			}
			return this
		};

		self.promise["then"] = function(successCallback, failureCallback) {
			var deferred = new Deferred(successCallback, failureCallback);
			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			}
			else if (state === REJECTED) {
				deferred.reject(promiseValue)
			}
			else {
				next.push(deferred)
			}
			return deferred.promise
		};

		function finish(type) {
			state = type || REJECTED;
			next.map(function(deferred) {
				state === RESOLVED && deferred.resolve(promiseValue) || deferred.reject(promiseValue)
			})
		}

		function thennable(then, successCallback, failureCallback, notThennableCallback) {
			if (((promiseValue != null && type.call(promiseValue) === OBJECT) || typeof promiseValue === FUNCTION) && typeof then === FUNCTION) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0;
					then.call(promiseValue, function(value) {
						if (count++) return;
						promiseValue = value;
						successCallback()
					}, function (value) {
						if (count++) return;
						promiseValue = value;
						failureCallback()
					})
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					failureCallback()
				}
			} else {
				notThennableCallback()
			}
		}

		function fire() {
			// check if it's a thenable
			var then;
			try {
				then = promiseValue && promiseValue.then
			}
			catch (e) {
				m.deferred.onerror(e);
				promiseValue = e;
				state = REJECTING;
				return fire()
			}
			thennable(then, function() {
				state = RESOLVING;
				fire()
			}, function() {
				state = REJECTING;
				fire()
			}, function() {
				try {
					if (state === RESOLVING && typeof successCallback === FUNCTION) {
						promiseValue = successCallback(promiseValue)
					}
					else if (state === REJECTING && typeof failureCallback === "function") {
						promiseValue = failureCallback(promiseValue);
						state = RESOLVING
					}
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError();
					finish()
				}
				else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}
	m.deferred.onerror = function(e) {
		if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) throw e
	};

	m.sync = function(args) {
		var method = "resolve";
		function synchronizer(pos, resolved) {
			return function(value) {
				results[pos] = value;
				if (!resolved) method = "reject";
				if (--outstanding === 0) {
					deferred.promise(results);
					deferred[method](results)
				}
				return value
			}
		}

		var deferred = m.deferred();
		var outstanding = args.length;
		var results = new Array(outstanding);
		if (args.length > 0) {
			for (var i = 0; i < args.length; i++) {
				args[i].then(synchronizer(i, true), synchronizer(i, false))
			}
		}
		else deferred.resolve([]);

		return deferred.promise
	};
	function identity(value) {return value}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
			var script = $document.createElement("script");

			window[callbackKey] = function(resp) {
				script.parentNode.removeChild(script);
				options.onload({
					type: "load",
					target: {
						responseText: resp
					}
				});
				window[callbackKey] = undefined
			};

			script.onerror = function(e) {
				script.parentNode.removeChild(script);

				options.onerror({
					type: "error",
					target: {
						status: 500,
						responseText: JSON.stringify({error: "Error making jsonp request"})
					}
				});
				window[callbackKey] = undefined;

				return false
			};

			script.onload = function(e) {
				return false
			};

			script.src = options.url
				+ (options.url.indexOf("?") > 0 ? "&" : "?")
				+ (options.callbackKey ? options.callbackKey : "callback")
				+ "=" + callbackKey
				+ "&" + buildQueryString(options.data || {});
			$document.body.appendChild(script)
		}
		else {
			var xhr = new window.XMLHttpRequest;
			xhr.open(options.method, options.url, true, options.user, options.password);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
					else options.onerror({type: "error", target: xhr})
				}
			};
			if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
			}
			if (options.deserialize === JSON.parse) {
				xhr.setRequestHeader("Accept", "application/json, text/*");
			}
			if (typeof options.config === FUNCTION) {
				var maybeXhr = options.config(xhr, options);
				if (maybeXhr != null) xhr = maybeXhr
			}

			var data = options.method === "GET" || !options.data ? "" : options.data
			if (data && (type.call(data) != STRING && data.constructor != window.FormData)) {
				throw "Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";
			}
			xhr.send(data);
			return xhr
		}
	}
	function bindData(xhrOptions, data, serialize) {
		if (xhrOptions.method === "GET" && xhrOptions.dataType != "jsonp") {
			var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
			var querystring = buildQueryString(data);
			xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "")
		}
		else xhrOptions.data = serialize(data);
		return xhrOptions
	}
	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi);
		if (tokens && data) {
			for (var i = 0; i < tokens.length; i++) {
				var key = tokens[i].slice(1);
				url = url.replace(tokens[i], data[key]);
				delete data[key]
			}
		}
		return url
	}

	m.request = function(xhrOptions) {
		if (xhrOptions.background !== true) m.startComputation();
		var deferred = new Deferred();
		var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
		var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
		var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
		var extract = isJSONP ? function(jsonp) {return jsonp.responseText} : xhrOptions.extract || function(xhr) {
			return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
		};
		xhrOptions.method = (xhrOptions.method || 'GET').toUpperCase();
		xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
		xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
		xhrOptions.onload = xhrOptions.onerror = function(e) {
			try {
				e = e || event;
				var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
				var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
				if (e.type === "load") {
					if (type.call(response) === ARRAY && xhrOptions.type) {
						for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
					}
					else if (xhrOptions.type) response = new xhrOptions.type(response)
				}
				deferred[e.type === "load" ? "resolve" : "reject"](response)
			}
			catch (e) {
				m.deferred.onerror(e);
				deferred.reject(e)
			}
			if (xhrOptions.background !== true) m.endComputation()
		};
		ajax(xhrOptions);
		deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
		return deferred.promise
	};

	//testing API
	m.deps = function(mock) {
		initialize(window = mock || window);
		return window;
	};
	//for internal testing only, do not use `m.deps.factory`
	m.deps.factory = app;

	return m
})(typeof window != "undefined" ? window : {});

if (typeof module != "undefined" && module !== null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() {return m});

},{}]},{},[1]);
