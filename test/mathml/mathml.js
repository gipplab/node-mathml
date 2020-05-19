'use strict';

const MathML = require('../../app/MathML/MathMLReader');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const file = path.join(__dirname, '..', 'data', '09-goat.mml.xml');
const xmlString = fs.readFileSync(file, 'utf8');
const pFile = path.join(__dirname, '..', 'data', '10-pmml-annotation.mml.xml');
const xmlPString = fs.readFileSync(pFile, 'utf8');
const xFile = path.join(__dirname, '..', 'data', '11-arxiv-ginev-18.mml.xml');
const xmlXString = fs.readFileSync(xFile, 'utf8');

describe('MathML reading', () => {

  it('should initialize with goat input', () => MathML(xmlString));
  it('should get goat content', () => {
    const mathml = MathML(xmlString);
    const contentRoot = mathml.contentRoot();
    assert(contentRoot);
    assert.equal(contentRoot.name(), 'apply');
    assert.equal(contentRoot.id, 'e40');
  });
  it('should get arxiv content', () => {
    let mathml = MathML(xmlXString);
    mathml = mathml.fixNamespace();
    const contentRoot = mathml.contentRoot();
    assert(contentRoot);
    assert.equal(contentRoot.name(), 'cn');
    assert.equal(contentRoot.id, 'S1.p3.1.m4.1.1.cmml');
  });
  it('xref should point to coresponding elements', () => {
    const mathml = MathML(xmlString);
    const contentRoot = mathml.contentRoot();
    const presentationRoot = contentRoot.refNode();
    assert.equal(contentRoot.id, presentationRoot.xref);
    assert.equal(presentationRoot.id, contentRoot.xref);
  });

  it('should initialize with pmml annotations', () => MathML(xmlPString));
  it('should get pmml annotations content', () => {
    const mathml = MathML(xmlPString);
    const contentRoot = mathml.contentRoot();
    assert(contentRoot);
    assert.equal(contentRoot.name(), 'apply');
    assert.equal(contentRoot.id, 'w2');
    assert.equal(contentRoot.xref, 'w29');
    assert(contentRoot.contentRoot());
  });

  it('should fail for empty input', () => assert.throws(() => MathML().contentRoot()));
  it('should fail for math elements without presentation', () => assert.throws(() => MathML('<math/>').contentRoot()));
  it('refNode should be empty if xref not specified', () => assert.equal(MathML('<math/>').refNode().length, 0));
  it('should find elements by ID', () => {
    const mathml = MathML(xmlPString);
    const actual = mathml.getElementById('w10');
    assert.equal(actual[0].getAttribute("id"), 'w10');

  });

});

describe('MathML positions', () => {
  it('xref should get first node position', () => {
    const mathml = MathML(xmlString);
    const first = mathml.first().estimateLocation();
    assert.equal(first.start.line, 1);
    assert.equal(first.start.ch, 1);
    assert.equal(first.end.line, 81);
    assert.equal(first.end.ch, 15);
  });
  it('xref should get content node position', () => {
    const mathml = MathML(xmlString);
    const first = mathml.contentRoot().estimateLocation();
    assert.equal(first.start.line, 52);
    assert.equal(first.start.ch, 7);
    assert.equal(first.end.line, 78);
    assert.equal(first.end.ch, 15);
  });
  it('xref should not fail for empty math tag', () => {
    const mathml = MathML('<math/>');
    const first = mathml.first().estimateLocation();
    assert.equal(first.start.line, 1);
    assert.equal(first.start.ch, 1);
    assert.equal(first.end.line, 1);
    assert.equal(first.end.ch, 1);
  });
});

describe('MathML editing', () => {
  it('delete a node', () => {
    const mathml = MathML(xmlString);
    let e42 = mathml.getElementById('e42');
    e42.delete();
    e42 = mathml.getElementById('e42');
    assert.equal(e42.length, 0);
    const empty = e42.delete();
    assert.equal(empty.length,0);
  });
  it('delete its child nodes', () => {
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    e42.delete();
    const e44 = mathml.getElementById('e44');
    assert.equal(e44.length, 0);
  });
  it('change a parent', () => {
    const mathml = MathML(xmlString);
    let e42 = mathml.getElementById('e42');
    const e48 = mathml.getElementById('e48');
    e48.appendChild(e42);
    e42 = mathml.getElementById('e42');
    assert.equal(e42.parent().id, 'e48');
  });
  it('reorder nodes', () => {
    const mathml = MathML(xmlString);
    let e52 = mathml.getElementById('e52');
    const e53 = mathml.getElementById('e53');
    e53.insertBefore(e52);
    e52 = mathml.getElementById('e52');
    assert.equal(e52.previous().id, 'e53');
  });
  it('change an id', () =>{
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    e42.id = "e42New";
    const e42New = mathml.getElementById('e42New');
    assert.equal(e42New.id, "e42New");
  });
  it('prefix one expression', () => {
    const mathml = MathML(xmlString);
    const e46 = mathml.getElementById('e46');
    e46.id = null;
    mathml.prefixName('A.');
    const e42 = mathml.getElementById('A.e42');
    const e43New = e42.next();
    assert.equal(e42.xref, "A.e3");
    assert.equal(e43New.id,null);
  });
  it('change an xref', () =>{
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    e42.xref = "newRef";
    assert.equal(e42.xref, "newRef");
  });
  it('clone a document', () =>{
    const mathml = MathML(xmlString);
    const mathml2 = mathml.cloneDoc();
    const e42New = mathml2.getElementById('e42');
    e42New.id = "e42New";
    const e42Old = mathml.getElementById('e42');
    assert.equal(e42New.id, "e42New");
    assert.equal(e42Old.id, "e42");
  });
  it('simplify ids', () => {
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    const e42Text = e42.text();
    mathml.simplifyIds('a');
    const a42 = mathml.getElementById('a42');
    assert.equal(a42.text(), e42Text);
  });
  it('simplify ids should generate ids beginning with p by default', () => {
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    const e42Text = e42.text();
    mathml.simplifyIds();
    const a42 = mathml.getElementById('p42');
    assert.equal(a42.text(), e42Text);
  });
  it('simplify ids should delete undefined references', () => {
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    e42.id = "notReferenced";
    mathml.simplifyIds('a');
    const a3 = mathml.getElementById('a3');
    assert.equal(a3.xref, null);
  });
  it('simplify ids should insert missing ids', () => {
    const mathml = MathML(xmlString);
    const e42 = mathml.getElementById('e42');
    e42.id = null;
    const e42Text = e42.text();
    mathml.simplifyIds('a');
    const a42 = mathml.getElementById('a42');
    assert.equal(a42.text(), e42Text);
  });
  it('minimalize output should be idempotent', () => {
    const mathml = MathML(xmlString);
    const pass1 = mathml.toMinimalPmml();
    const pass2 = pass1.toMinimalPmml();
    assert.equal(pass1.toString(), pass2.toString());
  });
  it('fixNamespace should be idempotent string', () => {
    const mathml = MathML(xmlXString).fixNamespace();
    const mathml2 = mathml.fixNamespace();
    assert.strictEqual(mathml.toString(),mathml2.toString());
  });
  it('minimalize arxiv string', () => {
    const mathml = MathML(xmlXString).fixNamespace();
    const minimal = mathml.toMinimalPmml(['id','xref','alttext','display','class','kmcs-r']);
    assert.strictEqual(minimal.toString().length, 66);
  });
  it('minimalize all attributes string', () => {
    const mathml = MathML(xmlXString).fixNamespace();
    const minimal = mathml.toMinimalPmml('all');
    assert.strictEqual(minimal.toString().length, 66);
  });
  it('minimalize with invialud config', () => {
    const mathml = MathML(xmlXString).fixNamespace();
    const minimal = mathml.toMinimalPmml('invalid');
    assert.strictEqual(minimal.toString().length, 198);
  });
});

