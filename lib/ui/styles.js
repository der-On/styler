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
    require('./editor/styles')
  ]
};
