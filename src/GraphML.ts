'use strict';

const renderer = require('./MathMLReader');
// language=XML
const graphHeader =  `<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
   http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="cRef" for="edge" attr.type="string"/>
</graphml>`;

renderer.base.prototype.toGraphML = function() {
  const g = renderer(graphHeader).c('graph');
  function addNode(g:any,n:any) {
    g.c('node',{
      id: `g.${n.id}`
    }).c('data',{
      key:'cRef'
    }).text(n.id);
  }
  function addEdge(g:any,child:any,parent:any) {
    g.c('edge',{
      source: `g.${parent.id}`,
      target: `g.${child.id}`
    });
  }
  // eslint-disable-next-line no-underscore-dangle
  this._addCTreeElements(g,addNode,addEdge);
  // Hack xtraverse does not correctly initialize all DOM features
  // might be related to https://github.com/jaredhanson/node-xtraverse/blob/master/lib/collection.js#L617
  return renderer(g.root().toString());

};

module.exports = renderer;
