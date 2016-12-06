
import React from 'react';
import {connect} from 'react-redux';

import SidePanels from './components.jsx';
import SuperEditor from '../ReactComponents/SuperEditor.jsx';

import {changeProgram} from './actions-reducers.js';


const SuperEditorContainer = connect(
  state => ({
    program: state.activeProgram.program
  }),
  dispatch => ({
    onProgramChange: (program) => dispatch(changeProgram(program))
  })
)(SuperEditor);

const EditorPage = () => (
  <div>
    <div style={{
      position: 'absolute',
      width: '80px',
      height: '100%',
      zIndex: '2'}}>
      <SidePanels/>
    </div>
    <div style={{
      position: 'absolute', 
      left: '80px', 
      width: 'calc(100% - 80px)', 
      height: '100%',
      zIndex: '1'}}>
      <SuperEditorContainer/>
    </div>
  </div>
);

export default EditorPage;
