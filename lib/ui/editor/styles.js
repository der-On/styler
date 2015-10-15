'use strict';

module.exports = {
  '.styler-editor': {
    position: 'fixed',
    top: '10px',
    right: '10px',
    bottom: '10xp',
    width: '400px',
    background: '#ddd',
    padding: '10px',
    box_shadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
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
  '.styler-editor-selector': {
    margin: '20px 0',
  }
};
