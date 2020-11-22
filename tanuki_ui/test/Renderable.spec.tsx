import * as React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import Renderable, { RenderableNode } from '../src/Renderable';

describe('Renderable', () => {
  it('runs a program tree', function() {
    const file = {
      version: '1.0.0',
      children: [
        { id: 'a', type: 'div', children: ['testing'], props: { 'className': 'test-name'} } as RenderableNode,
      ],
    };
    const node = shallow(<Renderable content={file} />);
    expect(node.text()).to.eq('testing');
  });
});
