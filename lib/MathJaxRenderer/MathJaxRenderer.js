'use strict';

const mjAPI = require('mathjax-node/lib/mj-single.js');

mjAPI.config({
  MathJax: {
    // traditional MathJax configuration
    ignoreMMLattributes: {
      id: true
    }
  },
  ignoreMMLattributes: {
    id: true
  }
});
mjAPI.start();

module.exports = class MathJaxRenderer {
  static renderMML(mml) {
    const mathml = mml.includes('<math', 0)
      ? mml
      : `<math xmlns="http://www.w3.org/1998/Math/MathML" id="A" class="ltx_Math" display="inline">${mml}</math>`;
    return new Promise((resolve, reject) => {
      mjAPI.typeset({
        ignoreMMLattributes: {
          id: true
        },
        math: mathml,
        format: 'MathML',
        svg: true
      }, (data) => {
        if (data.errors) reject(data.errors);
        else resolve(data.svg);
      });
    });
  }
};