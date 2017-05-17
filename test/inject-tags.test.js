import 'jsdom-global/register'
import {assert} from 'chai';
import injectTag, {removeSpacesBetweenTags} from '../lib/index';

describe('inject', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  context('remove space between tags', () => {

    it('should remove space', () => {
      const str = '<a></a>     <b></b>';

      assert.equal(
        removeSpacesBetweenTags(str),
        '<a></a><b></b>'
      );
    });
  });

  /**
   *
   * FIXME(sven): JSDom violates spec there
   * https://github.com/tmpvar/jsdom/issues/1802
   */
  context('noscript tag', () => {

    it('should not add the node to the DOM', () => {
      const tag = '<noscript>foobar</noscript>';

      injectTag(tag, document);

      assert.lengthOf(document.body.childNodes, 0);
    });

    it('should not add the nested img to the DOM', () => {
      const tag = '<noscript><div>foo</div><img /></noscript>';

      injectTag(tag, document);

      assert.lengthOf(document.body.childNodes, 0);
    });
  });

  context('script tag', () => {

    context('inline JavaScript', () => {

      it('should add the node to the DOM', () => {
        const js = 'Date.now();';
        const tag = `<script>${js}</script>`;

        injectTag(tag, document);

        const [script] = document.head.childNodes;

        assert.instanceOf(script, HTMLScriptElement);
        assert.equal(script.text, js);
      });

      it('should add multiple nodes to the DOM', () => {
        const tag = `
          <script>a=1</script>
          <script>b=2</script>
        `;

        injectTag(tag, document);

        const [script1, script2] = document.head.childNodes;

        assert.instanceOf(script1, HTMLScriptElement);
        assert.instanceOf(script2, HTMLScriptElement);

        assert.equal(script1.text, 'a=1');
        assert.equal(script2.text, 'b=2');
      });

      it('should execute the script', () => {
        const body = 'foo';
        const tag = `<script>document.body.innerHTML="${body}"</script>`;

        injectTag(tag, document);

        assert.equal(document.body.innerHTML, body);
      });

      it('should handle execution error of the script', () => {
        const tag = '<script>throw new Error("foo")</script>';

        injectTag(tag, document);

        assert.isTrue(true); // shouldn't have thrown an error before
      });
    });

    context('remote ressource', () => {

      it('should add the node to the DOM', () => {
        const src = 'http://foo/bar.js';
        const tag = `<script src="${src}"></script>`;

        injectTag(tag, document);

        const [script] = document.body.childNodes;

        assert.instanceOf(script, HTMLScriptElement);
        assert.equal(script.src, src);
      });
    });
  });

  context('image tag', () => {

    it('should add the node to the DOM', () => {
      const tag = '<img src="http://a.b/c.png"/>';

      injectTag(tag, document);

      const [img] = document.body.childNodes;

      assert.instanceOf(img, HTMLImageElement);
      assert.equal('http://a.b/c.png', img.src);
    });

    it('should add the nested nodes to the DOM', () => {
      const tag = '<div><img src="http://a.b/c.png"/></div>';

      injectTag(tag, document);

      const [div] = document.body.childNodes;
      const [img] = div.childNodes;

      assert.instanceOf(img, HTMLImageElement);
    });
  });

  context('div', () => {

    it('should add the node to the DOM', () => {
      const tag = '<div>foo</div>';

      injectTag(tag, document);

      const [div] = document.body.childNodes;

      assert.instanceOf(div, HTMLDivElement);
      assert.equal('foo', div.innerHTML);
    });
  });
});
