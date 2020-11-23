import * as React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import Renderable, { RenderableNode } from '../src/Renderable';

describe('Renderable', () => {
  it('runs a program tree', function() {
    const file = {
      version: '1.0.0',
      children: [
        { id: 'a', type: 'div', children: ['testing'], props: { 'className': 'test-name'} } as RenderableNode,
      ],
    };
    const node = mount(<Renderable content={file} />);
    expect(node.text()).to.eq('testing');
  });
});
