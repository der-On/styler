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

module.exports = {
  getCoords: getCoords,
  getSelector: getSelector,
  isWithinStyler: isWithinStyler,
  later: later,
  removeEmpty: removeEmpty
};
