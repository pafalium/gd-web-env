
import React from 'react';
import {render} from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';

import editorState from './actions-reducers.js';
import EditorPage from './EditorPage.jsx';

let store = createStore(editorState);


render(
  <Provider store={store}>
    <EditorPage/>
  </Provider>,
  document.getElementById('container')
);
