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
