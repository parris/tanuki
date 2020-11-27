import * as React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import Renderable, { ComponentType, RenderableNode, Versions, TemplateComponent } from '../src/Renderable';

describe('Renderable', () => {
  it('runs a program tree', function() {
    const file = {
      version: Versions.v1,
      components: {},
      body: [
        { id: 'a', type: 'div', nodes: ['testing'], props: { 'className': 'test-name'} } as RenderableNode,
      ],
    };
    const node = mount(<Renderable {...file} />);
    expect(node.text()).to.eq('testing');
    expect(node.find('.test-name').length).to.eq(1);
  });

  it('can render a module based component', function() {
    const file = {
      version: Versions.v1,
      components: {
        'button': {
          options: {},
          render: ({ className, children }: { className: string, children: React.ReactNode }) => (<button className={className}>{children}</button>),
        }
      },
      body: [
        { id: 'a', type: 'div', nodes: ['testing1'], props: { 'className': 'test-name'} } as RenderableNode,
        { id: 'b', type: ComponentType.module, componentType: 'button', nodes: ['testing2'], props: { 'className': 'meow'} } as RenderableNode,
      ],
    };
    const node = mount(<Renderable {...file} />);
    expect(node.text()).to.eq('testing1testing2');

    // NOTE: using find('button') seems a bit unreliable here. The final render does indeed give the correct result.
    // I believe since we're wrapping our components with our own RenderableNodes we get an incorrect result from enzyme.
    // IMO seems good to test the final html result at least once anyways *shrug*.
    expect((node.html().match(/\<button/g) || []).length).to.eq(1);
    expect((node.html().match(/class\=\"meow\"/g) || []).length).to.eq(1);
  });

  it('can render a template component', function() {
    const file = {
      version: Versions.v1,
      components: {
        'button': {
          options: {
            href: 'string',
            text: 'string',
          },
          template: {
            id: 'abc',
            type: 'a',
            props: {
              href: "${options.href}",
              style: { 'display': 'block' },
            },
            nodes: [
              {
                id: 'qed',
                type: 'span',
                nodes: ["${options.text}"]
              }
            ],
          } as TemplateComponent,
        },
      },
      body: [
        { id: 'a', type: 'div', nodes: ['testing1'], props: { 'className': 'test-name'} } as RenderableNode,
        { id: 'b', type: ComponentType.template, componentType: 'button', options: { href: 'https://tanuki.fun', text: 'Pizza'} } as RenderableNode,
      ],
    };
    const node = mount(<Renderable debug={true} {...file} />);
    expect(node.text()).to.eq('testing1Pizza');

    expect(node.find('a').first().props().href).to.eq('https://tanuki.fun');
    expect((node.html().match(/data\-tanuki\-id\=\"b\"/g) || []).length).to.eq(1);
    expect((node.html().match(/data\-tanuki\-id\=\"b-qed\"/g) || []).length).to.eq(1);
  });
});
