'use strict';

const renderer = require('../../app/MathML/MathMLRenderer');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const file = path.join(__dirname,'..','data','09-goat.mml.xml');
const xmlString = fs.readFileSync(file, 'utf8');

describe('mathml rendering', () => {
  it('should initialize with goat input', () => renderer(xmlString));
  it('should link to an imageUrl', () => {
    const rend = renderer(xmlString);
    const imgUrl = rend.imgUrl();
    assert.ok(imgUrl.startsWith("http"));
  });
  it('should link to an imageUrl in first format', () => {
    const rend = renderer(xmlString);
    const imgUrl = rend.contentRoot().imgUrl("first");
    assert.ok(imgUrl.startsWith("http"));
  });
  it('should link to a imageUrl with divide operator', () => {
    const rend = renderer(xmlString);
    const divide = rend.getElementById('e47');
    const imgUrl = divide.imgUrl("first");
    assert.ok(imgUrl.startsWith("http"));
  });
  it('should link to a imageUrl with a collapsed divide operator', () => {
    const rend = renderer(xmlString);
    const divide = rend.getElementById('e47');
    const imgUrl = divide.imgUrl("collapsed");
    assert.ok(imgUrl.startsWith("http"));
  });
});
