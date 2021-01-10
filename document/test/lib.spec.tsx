import * as React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import { Document, ComponentTypes, ElementProps, Versions, Template } from '../src/lib';

describe('Document', () => {
  it('runs a program tree', function() {
    const file = {
      version: Versions.v1,
      nodes: {
        'a': { id: 'a', type: 'div', content: 'testing', props: { 'className': 'test-name'} } as ElementProps,
      },
      root: ['a'],
    };
    const node = mount(<Document file={file} components={{}} />);
    expect(node.text()).to.eq('testing');
    expect(node.find('.test-name').length).to.eq(1);
  });

  it('can render a module based component', function() {
    const components = {
      'Button': {
        type: ComponentTypes.module,
        options: {},
        render: ({ className, children }: { className: string, children: React.ReactNode }) => (<button className={className}>{children}</button>),
      }
    };
    const file = {
      version: Versions.v1,
      nodes: {
        'a': { id: 'a', type: 'div', content: 'testing1', props: { 'className': 'test-name'} } as ElementProps,
        'b': { id: 'b', type: 'Button', content: 'testing2', props: { 'className': 'meow'} } as ElementProps,
      },
      root: ['a', 'b'],
    };
    const node = mount(<Document file={file} components={components} />);
    expect(node.text()).to.eq('testing1testing2');

    // NOTE: using find('button') seems a bit unreliable here. The final render does indeed give the correct result.
    // I believe since we're wrapping our components with our own RenderableNodes we get an incorrect result from enzyme.
    // IMO seems good to test the final html result at least once anyways *shrug*.
    expect((node.html().match(/\<button/g) || []).length).to.eq(1);
    expect((node.html().match(/class\=\"meow\"/g) || []).length).to.eq(1);
  });

  it('can render a template component', function() {
    const components = {
      'Button': {
        type: ComponentTypes.template,
        options: {
          href: 'string',
          text: 'string',
        },
        template: {
          nodes: {
            'abc': {
              id: 'abc',
              type: 'a',
              childIds: ['qed'],
              props: {
                href: "${options.href}",
                style: { 'display': 'block' },
              },
            },
            'qed': {
              id: 'qed',
              type: 'span',
              content: "${options.text}",
            },
          },
          root: ['abc'],
        } as Template,
      },
    };
    const file = {
      version: Versions.v1,
      nodes: {
        'a': { id: 'a', type: 'div', childIds: ['c'], props: { 'className': 'test-name'} } as ElementProps,
        'b': { id: 'b', type: 'Button', options: { href: 'https://tanuki.fun', text: 'Pizza'} } as ElementProps,
        'c': { id: 'c', type: 'span', content: 'testing1' } as ElementProps,
      },
      root: ['a', 'b'],
    };
    const node = mount(<Document debug={true} file={file} components={components} />);
    expect(node.text()).to.eq('testing1Pizza');

    expect(node.find('a').first().props().href).to.eq('https://tanuki.fun');
    expect((node.html().match(/data\-tanuki\-id\=\"b-abc\"/g) || []).length).to.eq(1);
    expect((node.html().match(/data\-tanuki\-id\=\"b-qed\"/g) || []).length).to.eq(1);
  });
});
