
import React from 'react';
import {createRoot} from 'react-dom/client';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import editorState from '../app-redux-store/editor-state.js';
import EditorPage from './EditorPage.jsx';
import { loadExamples } from '../examples.js';


const store = createStore(
  editorState, 
  applyMiddleware(
    thunkMiddleware,
    createLogger()
  )
);

loadExamples(store).then(_ => console.log('Examples loaded'));


const container = document.getElementById('container');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <EditorPage/>
  </Provider>);
