
import React from 'react';

import SidePanels from './components.jsx';
import CurrentProgramEditor from './CurrentProgramEditor.jsx';


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
      <CurrentProgramEditor/>
    </div>
  </div>
);

export default EditorPage;
