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
    top: '60px',
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
