'use strict';

const renderer = require('../../app/MathML/MathMLRenderer');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname,'..','data','09-goat.mml.xml');
const xmlString = fs.readFileSync(file, 'utf8');

describe('mathml rendering', () => {
  it('should initialize with goat input', () => renderer(xmlString));
});
