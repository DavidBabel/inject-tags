const {assert} = require('chai');
const {injectTag, removeSpacesBetweenTags} = require('../lib/cjs/index');

describe('inject', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('remove space between tags', () => {

    it('should remove space', () => {
      const str = '<a></a>     <b></b>';

      assert.equal(
        removeSpacesBetweenTags(str),
        '<a></a><b></b>'
      );
    });
  });

  describe('script tag', () => {

    describe('inline JavaScript', () => {

      it('should add the node to the DOM', () => {
        const js = 'Date.now();';
        const tag = `<script>${js}</script>`;

        injectTag(tag, document.body);

        assert.equal(document.body.childNodes.length, 1);
        const [script] = document.body.childNodes;

        assert.instanceOf(script, HTMLScriptElement);
        assert.equal(script.text, js);
      });

      it('should add multiple nodes to the DOM', () => {
        const tag = `
          <script>a=1</script>
          <script>b=2</script>
        `;

        const expected = '<script type="text/javascript">a=1</script>'
         + '<script type="text/javascript">b=2</script>';

        injectTag(tag, document.body);

        assert.equal(document.body.innerHTML, expected);
      });

      it('should execute the script', () => {
        const body = 'foo';
        const tag = `<script>document.body.innerHTML="${body}"</script>`;

        injectTag(tag, document.body);

        process.nextTick(() => {
          assert.equal(document.body.innerHTML, body);
          assert.equal(document.body.childNodes.length, 1);
        });
      });

      it('should handle execution error of the script', () => {
        const tag = '<script>throw new Error("foo")</script>';

        injectTag(tag, document.body);

        assert.isTrue(true); // shouldn't have thrown an error before
      });
    });

    describe('remote ressource', () => {

      it('should add the node to the DOM', () => {
        const src = 'http://foo/bar.js';
        const tag = `<script src="${src}"></script>`;

        injectTag(tag, document.body);

        assert.equal(document.body.childNodes.length, 1);
        const [script] = document.body.childNodes;

        assert.instanceOf(script, HTMLScriptElement);
        assert.equal(script.src, src);
      });
    });
  });

  describe('image tag', () => {

    it('should add the node to the DOM', () => {
      const tag = '<img src="http://a.b/c.png"/>';

      injectTag(tag, document.body);

      assert.equal(document.body.childNodes.length, 1);
      const [img] = document.body.childNodes;

      assert.instanceOf(img, HTMLImageElement);
      assert.equal('http://a.b/c.png', img.src);
    });

    it('should add the nested nodes to the DOM', () => {
      const tag = '<div><img src="http://a.b/c.png"/></div>';

      injectTag(tag, document.body);

      assert.equal(document.body.childNodes.length, 1);
      const [div] = document.body.childNodes;
      const [img] = div.childNodes;

      assert.instanceOf(img, HTMLImageElement);
    });
  });

  describe('div', () => {

    it('should add nested divs to the DOM', () => {
      const tag = '<div>foo<div>bar<div>foo</div></div></div>';

      injectTag(tag, document.body);

      assert.equal(document.body.childNodes.length, 1);
      const [div] = document.body.childNodes;

      assert.instanceOf(div, HTMLDivElement);
      assert.equal('foo<div>bar<div>foo</div></div>', div.innerHTML);
    });

    it('should add the node to the DOM', () => {
      const tag = '<div>foo</div>';

      injectTag(tag, document.body);

      assert.equal(document.body.childNodes.length, 1);
      const [div] = document.body.childNodes;

      assert.instanceOf(div, HTMLDivElement);
      assert.equal('foo', div.innerHTML);
    });
  });

  describe('style', () => {

    it('should add the style node to the DOM', () => {
      const tag = '<style type="text/css">body {background: red;}</style>';

      injectTag(tag, document.body);

      assert.equal(document.body.childNodes.length, 1);
      const [style] = document.body.childNodes;

      assert.instanceOf(style, HTMLStyleElement);
      assert.equal('body {background: red;}', style.textContent);
    });
  });

  it('ensure no duplicated scripts', () => {

    injectTag(
      `<div>
        <script src="a.js"></script>
      </div>
      <script src="b.js"></script>`,
      document.body
    );

    assert.equal(document.body.getElementsByTagName('script').length, 2);
  });
});
