
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';

import store from '../app-redux-store/editor-state.js';
import {loadExamples} from '../examples.js';
import EditorPage from './EditorPage.jsx';


loadExamples(store)
  .then(_ => console.log('Examples loaded'));


const container = document.getElementById('container');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <EditorPage/>
  </Provider>);
