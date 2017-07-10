/* @flow */
import './arrayFromPolyfill';

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
  const proto = DOMParser.prototype, nativeParse = proto.parseFromString;

  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if (new DOMParser().parseFromString('', 'text/html')) {
      // text/html parsing is natively supported
      return;
    }
  } catch (ex) {
    // Ignore
  }

  (proto: any).parseFromString = function(markup, type) {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      const doc = document.implementation.createHTMLDocument('');
      if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        // eslint-disable-next-line
        doc.documentElement.innerHTML = markup;
      } else {
        // eslint-disable-next-line
        doc.body.innerHTML = markup;
      }
      return doc;
    } else {
      return nativeParse.apply(this, arguments);
    }
  };
})(window.DOMParser);

/**
 * parse string as DOM
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
export function traverseNodes(nodeArray: [], loadSync: boolean = false) {
  return nodeArray.reduce(
    (res, node) => {
      if (node.tagName === 'SCRIPT') {
        const script = document.createElement('script');
        script.type = 'text/javascript';

        if (node.text) {
          script.text = node.text;
        }

        if (node.src) {
          script.src = node.src;
        }

        if (loadSync) {
          script.async = true;
        }

        res.push(script);
      } else {
        const childs = [...node.childNodes];
        node.innerHTML = '';
        traverseNodes(childs).forEach((child) => node.appendChild(child));
        res.push(node);
      }

      return res;
    },
    []
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
export function injectTag(
  tag: string,
  container: HTMLElement,
  loadSync: boolean = false
) {
  const parsedDocument: any = parseDOM(tag);

  const scripts = traverseNodes(
    [...parsedDocument.head.childNodes, ...parsedDocument.body.childNodes],
    loadSync
  );

  [...parsedDocument.body.childNodes, ...scripts].forEach((node) => {
    container.appendChild(node);
  });
}
