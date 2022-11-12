
import React from 'react';
import {connect} from 'react-redux';

import {HorizontalBar} from '../ReactComponents/Common/layout.jsx';

import SuperEditor from '../ReactComponents/SuperEditor.jsx';
import {changeProgram} from '../app-redux-store/editor-state.js';


const ProgramName = ({name}) => (
  <HorizontalBar>
    <h1>{name}</h1>
  </HorizontalBar>
);

const ProgramNameContainer = connect(
  state => ({name: state.activeProgram.name})
)(ProgramName);



const SuperEditorContainer = connect(
  state => ({
    program: state.activeProgram.program
  }),
  dispatch => ({
    onProgramChange: (program) => dispatch(changeProgram(program))
  })
)(SuperEditor);



export const CurrentProgramEditor = () => (
  <div>
    <div style={{}}>
      <ProgramNameContainer/>
    </div>
    <div style={{width: '100%', height: 'calc(100% - 3em)'}}>
      <SuperEditorContainer/>
    </div>
  </div>
);

export default CurrentProgramEditor;
