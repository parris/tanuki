import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'redux-zero/react';

import { store } from './data/store';

render((
  <Provider store={store as any}>{(
    <div>
      <h1>Tanuki</h1>
    </div>
  ) as any}</Provider>
), document.getElementById('app') as HTMLElement);
