
import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {selectActiveProgram} from '../app-redux-store/editor-state.js';
import { updateActiveProgram } from '../app-redux-store/programs.js';

import {HorizontalBar} from '../ReactComponents/Common/layout.jsx';
import SuperEditor from '../ReactComponents/SuperEditor.jsx';


function ProgramName() {
  const name = useSelector(state => selectActiveProgram(state).name);
  return (
    <HorizontalBar>
      <h1>{name}</h1>
    </HorizontalBar>
  );
}


export function CurrentProgramEditor() {
  const activeProgramSource = useSelector(state => selectActiveProgram(state).program);
  const dispatch = useDispatch();
  return (
  <div>
    <div style={{}}>
      <ProgramName/>
    </div>
    <div style={{width: '100%', height: 'calc(100% - 3em)'}}>
      <SuperEditor 
        program={activeProgramSource}
        onProgramChange={newSource => dispatch(updateActiveProgram({program: newSource}))}/>
    </div>
  </div>
  );
}

export default CurrentProgramEditor;
