
import React from 'react';
import {render} from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import editorState from '../app-redux-store/editor-state.js';
import EditorPage from './EditorPage.jsx';
import { loadExamples } from '../examples.js';

const loggerMiddleware = createLogger();

const store = createStore(
  editorState, 
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
);

loadExamples(store).then(_ => console.log('Examples loaded'));

render(
  <Provider store={store}>
    <EditorPage/>
  </Provider>,
  document.getElementById('container')
);
