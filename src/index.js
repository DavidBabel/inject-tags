/* @flow */

/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {

  let
    proto = DOMParser.prototype
    , nativeParse = proto.parseFromString
    ;

  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if ((new DOMParser()).parseFromString('', 'text/html')) {
      // text/html parsing is natively supported
      return;
    }
  } catch (ex) {
    // Ignore
  }

  (proto: any).parseFromString = function(markup, type) {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      let
        doc = document.implementation.createHTMLDocument('')
        ;
      if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        doc.documentElement.innerHTML = markup;
      }
      else {
        doc.body.innerHTML = markup;
      }
      return doc;
    } else {
      return nativeParse.apply(this, arguments);
    }
  };
}(window.DOMParser));

/**
 * parse string as DOM
 *
 * TODO(sven): add polyfill for DOMParser
 *
 * @param {string} str
 * @returns {Document}
 */
function parseDOM(str: string): Document {
  const parser = new window.DOMParser();

  str = removeSpacesBetweenTags(str).trim();

  return parser.parseFromString(str, 'text/html');
}


/**
 * Remove spaces between tags
 *
 * DOMParser cause some DOM nodes to turn textNode when they are prefixed with
 * a space.
 *
 * @param {string} str
 * @returns {string}
 */
export function removeSpacesBetweenTags(str: string): string {
  return str.replace(/\>[\s]+\</g, '><');
}

/**
 * Recursively parse and inject track tags
 */
export function traverseNodes(nodeArray: [], targetDocument: Document, loadSync: boolean = false) {
  nodeArray.forEach(
    (node) => {
      if (node.tagName === 'SCRIPT' && !node.src && node.text) {
        const script = targetDocument.createElement('script');
        script.type = 'text/javascript';
        script.text = node.text;
        if (loadSync) {
          script.async = true;
        }

        targetDocument.head.appendChild(script);
        node.remove();
        return;
      }
      if (node.tagName === 'SCRIPT' && node.parentNode.tagName === 'HEAD') {
        node.remove();
        targetDocument.body.appendChild(node.cloneNode());
        return;
      }
      if (node.tagName === 'NOSCRIPT') {
        node.remove();
        return;
      }
      traverseNodes([...node.childNodes], targetDocument);
    }
  );
}

/**
 * inject ad tag in the DOM
 *
 * noscript tags:
 * > Spec: the contents of noscript get parsed as markup
 *
 * FIXME(sven): JSDom violates spec there, content is not returned
 * https://github.com/tmpvar/jsdom/issues/1802
 *
 * TODO(sven): Find a way to inject scripts
 * https://twitter.com/svensauleau/status/850358061898358784
 *
 * TODO(david.babel@ogury.co): Lancer une exception dans sentry en cas d'erreur ?
 *
 * @param {string} tag
 * @param {Document} targetDocument
 */
export default function injectTag(tag: string, targetDocument: Document = document, loadSync: boolean = false) {
  const parsedDocument: any = parseDOM(tag);

  traverseNodes([...parsedDocument.head.childNodes, ...parsedDocument.body.childNodes], targetDocument, loadSync);

  [...parsedDocument.body.childNodes].forEach((node) => {
    targetDocument.body.appendChild(node);
  });
}