'use strict';


const base = require('xtraverse/lib/collection.js');
const xPath = require('xpath');

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

const xCmml = xPath.parse('//m:annotation-xml[@encoding="MathML-Content"]');
const xPmml = xPath.parse('//m:annotation-xml[@encoding="MathML-Presentation"]');
const xSemantics = xPath.parse('//m:semantics');

// const log = require('winston/lib/winston.js');

interface BaseType {
  [propName: string]: any;
  id:string;
  xref:string|null;
}


function defineProperty(p: string) {
  Object.defineProperty(base.prototype, p, {
    get() {
      return this.attr(p);
    },
    set(x) {
      if (x === null) {
        this[0].removeAttribute(p);
      }
      return this.attr(p, x);
    },
  });
}

defineProperty('id');
defineProperty('xref');

base.prototype.getElementById = function(id: string) {
  return base.wrap(this[0].ownerDocument.getElementById(id));
};

base.prototype.select1 = function(path: any) {
  return base.wrap(
    path.select1({
      node: this[0],
      namespaces: {
        m: MATHML_NS,
      },
    }));
};

base.prototype.fixNamespace = function() {
  const doc = this.root();
  if (doc[0].namespaceURI !== MATHML_NS) {
    doc.attr('xmlns', MATHML_NS);
    return base.wrap(doc.toString());
  } else {
    return this;
  }
};

base.prototype.contentRoot = function() {
  const doc = this.root();
  let content = doc.select1(xCmml);
  if (content.length === 0) {
    const pmmlContent = doc.select1(xPmml);
    if (pmmlContent.length === 0) {
      throw new Error('No content MathML present');
    }
    // use semantic node as root, first child should be the first cmml node
    content = doc.select1(xSemantics);
  }
  return content.children().first();
};

base.prototype.refNode = function() {
  const xref = this.xref;
  if (xref) {
    return base.wrap(this[0].ownerDocument.getElementById(xref));
  } else {
    return base.wrap([]);
  }
};

base.prototype.estimateLocation = function(offset = { line: 0, ch: 0 }) {
  function getLoc(n: { lineNumber: number, columnNumber: number }) {
    return {
      line: n.lineNumber + offset.line,
      ch: n.columnNumber + offset.ch,
    };
  }

  const n = this[0];
  let next = n.nextSibling;
  const start = getLoc(n);
  if (!next) {
    if (n.lastChild) {
      // log.info('estimate end of node based on the last child');
      next = n.lastChild;
    } else {
      // log.warn('cannot estimate end of node');
      next = n;
    }
  }
  const end = getLoc(next);
  return { start, end };
};

// eslint-disable-next-line no-underscore-dangle
base.prototype._addCTreeElements = function(elements: any, exportNode: any, exportEdge: any) {
  function addNodeRecurse(n: BaseType) {
    exportNode(elements, n);
    n.children().map((c: any) => {
        const child = base.wrap(c);
        exportEdge(elements, child, child.parent());
        addNodeRecurse(child);
      },
    );
  }

  addNodeRecurse(this.contentRoot());
  return this;
};

base.prototype.delete = function() {
  if (!this.length) {
    return base.wrap([]);
  }
  const n = this[0];
  n.parentNode.removeChild(n);
  return this;
};

base.prototype.appendChild = function(newChild: BaseType) {
  const n = this[0];
  n.appendChild(newChild[0]);
  return this;
};

base.prototype.insertBefore = function(newChild: BaseType) {
  const n = this[0];
  n.parentNode.insertBefore(n, newChild[0]);
  return this;
};

function forall(func: (x) => any, node: BaseType) {
  function apply(n: BaseType) {
    const node = base.wrap(n);
    func(node);
    node.children().forEach(apply);
  }

  apply(node);
}

base.prototype.prefixName = function(prefix: string) {
  function rename(x: BaseType) {
    if (x.id) {
      x.id = prefix + x.id;
    }
    if (x.xref) {
      x.xref = prefix + x.xref;
    }
  }

  forall(rename, this.root());
  return this;
};

base.prototype.simplifyIds = function(prefix = 'p') {
  const ids: any = {};
  let counter = 0;

  function renameIds(n: BaseType) {
    const newId = prefix + counter.toString();
    if (n.id) {
      ids[n.id] = newId;
    }
    counter++;
    n.id = newId;
  }

  function replaceReferences(n: BaseType) {
    if (n.xref) {
      if (ids[n.xref]) {
        n.xref = ids[n.xref];
      } else {
        n.xref = null;
      }
    }
  }

  forall(renameIds, this.root());
  forall(replaceReferences, this.root());

  return this;
};

base.prototype.clone = function(node?: any) {
  if (!node) {
    node = this[0];
  }
  const ownerDocument = this.root()[0].ownerDocument;
  const newDocument = ownerDocument.implementation.createDocument(
    ownerDocument.namespaceURI, null, null);
  const newNode = newDocument.importNode(node, true);
  newDocument.appendChild(newNode);
  return base.wrap(newDocument);
};

base.prototype.cloneDoc = function() {
  const ownerDocument = this.root()[0].ownerDocument;
  return this.clone(ownerDocument.documentElement);
};

base.prototype.toMinimalPmml = function(ignorableAttributes:(string[]|string) = [
  'alttext',
  'id',
  'xref',
  // , 'stretchy'
]) {

  function remove(n: BaseType) {
    if (n.name() === 'annotation') {
      n.delete();
    }
    if (ignorableAttributes instanceof Array) {
      ignorableAttributes.forEach(a => n[0].removeAttribute(a));
    } else if (ignorableAttributes === 'all' && n[0].hasAttributes) {
      const attribs = n[0].attributes;
      const len = attribs.length;
      for (let i = 0; i < len; i++) {
        n[0].removeAttribute(attribs.item(0).nodeName);
      }
    }
    // remove empty strings
    for (let c = n[0].firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3 && /\s/g.test(c.nodeValue)) {
        c.parentNode.removeChild(c);
      }
    }
  }

  const other = this.clone();
  try {
    other.contentRoot().parent().delete();
  } catch (e) {
    // ignore
  }

  // remove superfluous semantics container
  const semantics = other.children('semantics');
  if (semantics.length) {
    const content = semantics.children();
    content.forEach((c: any) => {
      other.first()[0].appendChild(c);
    });
    semantics.delete();
  }
  forall(remove, other);

  return other;
};

module.exports = base.wrap;
module.exports.base = base;
