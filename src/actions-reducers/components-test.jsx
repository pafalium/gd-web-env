
import React from 'react';
import {render} from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import editorState from './actions-reducers.js';
import EditorPage from './EditorPage.jsx';

const loggerMiddleware = createLogger();

const store = createStore(
  editorState, 
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
);


render(
  <Provider store={store}>
    <EditorPage/>
  </Provider>,
  document.getElementById('container')
);
