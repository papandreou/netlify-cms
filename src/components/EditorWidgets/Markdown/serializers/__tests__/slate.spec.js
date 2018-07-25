import { flow } from 'lodash';
import { markdownToSlate, slateToMarkdown } from '../index';

const process = flow([markdownToSlate, slateToMarkdown]);

describe('slate', () => {
  it('should not decode encoded html entities in inline code', () => {
    expect(process('<code>&lt;div&gt;</code>')).toEqual('<code>&lt;div&gt;</code>');
  });

  it('should parse non-text children of mark nodes', () => {
    expect(process('**a[b](c)d**')).toEqual('**a[b](c)d**');
    expect(process('**[a](b)**')).toEqual('**[a](b)**');
    expect(process('**![a](b)**')).toEqual('**![a](b)**');
    expect(process('_`a`_')).toEqual('_`a`_');
    expect(process('_`a`b_')).toEqual('_`a`b_');
  });

  it('should condense adjacent, identically styled text and inline nodes', () => {
    // The flattening happens due to https://github.com/netlify/netlify-cms/issues/1448
    expect(process('**a ~~b~~~~c~~**')).toEqual('**a** ~~**bc**~~');
    expect(process('**a ~~b~~~~[c](d)~~**')).toEqual('**a** ~~**b[c](d)**~~');
  });

  it('should handle nested markdown entities', () => {
    expect(process('**a**b**c**')).toEqual('**a**b**c**');
    // The flattening happens due to https://github.com/netlify/netlify-cms/issues/1448
    expect(process('**a _b_ c**')).toEqual('**a** _**b**_ **c**');
  });

  it('should parse inline images as images', () => {
    expect(process('a ![b](c)')).toEqual('a ![b](c)');
  });

  it('should not escape markdown entities in html', () => {
    expect(process('<span>*</span>')).toEqual('<span>*</span>');
  });

  it('should not produce invalid markdown when a styled block has trailing whitespace', () => {
    const slateAst = {
      kind: 'block',
      type: 'root',
      nodes: [
        {
          kind: 'block',
          type: 'paragraph',
          nodes: [
            {
              kind: 'text',
              leaves: [
                {
                  text: 'foo ', // <--
                  marks: [
                    { type: 'bold' },
                  ],
                },
              ],
            },
            {
              kind: 'text',
              leaves: [
                { text: 'bar' },
              ],
            },
          ],
        },
      ],
    };
    expect(slateToMarkdown(slateAst)).toEqual('**foo** bar');
  });

  it('should not produce invalid markdown when a styled block has leading whitespace', () => {
    const slateAst = {
      kind: 'block',
      type: 'root',
      nodes: [
        {
          kind: 'block',
          type: 'paragraph',
          nodes: [
            {
              kind: 'text',
              leaves: [
                { text: 'foo' },
              ],
            },
            {
              kind: 'text',
              leaves: [
                {
                  text: ' bar', // <--
                  marks: [
                    { type: 'bold' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(slateToMarkdown(slateAst)).toEqual('foo **bar**');
  });
});
