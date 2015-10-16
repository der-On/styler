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
