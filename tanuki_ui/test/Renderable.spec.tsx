import * as React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import Renderable, { RenderableNode } from '../src/Renderable';

describe('Renderable', () => {
  it('runs a program tree', function() {
    const file = {
      version: '1.0.0',
      components: {},
      children: [
        { id: 'a', type: 'div', children: ['testing'], props: { 'className': 'test-name'} } as RenderableNode,
      ],
    };
    const node = mount(<Renderable content={file} />);
    expect(node.text()).to.eq('testing');
    expect(node.find('.test-name').length).to.eq(1);
  });

  it('can render a custom component', function() {
    const file = {
      version: '1.0.0',
      components: {
        'button': ({ className, children }: { className: string, children: React.ElementType }) => (<button className={className}>{children}</button>),
      },
      children: [
        { id: 'a', type: 'div', children: ['testing1'], props: { 'className': 'test-name'} } as RenderableNode,
        { id: 'b', type: 'component', componentType: 'button', children: ['testing2'], props: { 'className': 'meow'} } as RenderableNode,
      ],
    };
    const node = mount(<Renderable content={file} />);
    expect(node.text()).to.eq('testing1testing2');

    // NOTE: using find('button') seems a bit unreliable here. The final render does indeed give the correct result.
    // I believe since we're wrapping our components with our own RenderableNodes we get an incorrect result from enzyme.
    // IMO seems good to test the final html result at least once anyways *shrug*.
    expect((node.html().match(/\<button/g) || []).length).to.eq(1);
    expect((node.html().match(/class\=\"meow\"/g) || []).length).to.eq(1);
  });
});
