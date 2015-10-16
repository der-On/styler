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
