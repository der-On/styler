'use strict';

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

function getInputFor(prop) {
  return props[prop] || inputs.text();
}

module.exports = {
  properties: props,
  inputs: inputs,
  getInputFor: getInputFor
};
