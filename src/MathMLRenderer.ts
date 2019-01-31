/* eslint-disable no-param-reassign */

'use strict';

const reader = require('./MathMLReader');
const opMap = require('./operationMap');
const zlib = require('zlib');

const conf = require('../config.js');

reader.base.prototype.imgUrl = function(format: string | boolean = false) {
  /**
   * @return {string}
   */
  function toMML(mml: string) {
    if (!mml.trim().startsWith('<math')) {
      mml = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">${mml}</math>`;
    }
    mml = reader(mml).toMinimalPmml().toString();
    return zlib.deflateSync(mml).toString('base64');
  }

  let node = this.first();
  if (format === false) {
    format = this.expansion;
  }
  if (format === 'first' && this.name() === 'apply') {
    node = this.children().first();
  }
  const collapsedApply = format === 'collapsed' && this.name() === 'apply';
  if (!collapsedApply && opMap.hasOwnProperty(node.name())) {
    node = opMap[node.name()];
  } else if (node.refNode().length) {
    node = node.refNode();
  }
  const mml = toMML(node.toString());
  return `${conf.get('mathoidUrl')}/zlib/svg/mml/${encodeURIComponent(mml)}`;
};

module.exports = reader;

