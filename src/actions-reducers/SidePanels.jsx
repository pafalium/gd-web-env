
import React, { useState } from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Select from 'react-select';

import {VerticalIconBar, Spacer, Drawer} from '../ReactComponents/Common/layout.jsx';
import {IconButton} from '../ReactComponents/Common/input.jsx';

import {setActiveProgram} from '../app-redux-store/programs.js';
import { 
  setExportCads,
  doExportToCads, 
  doClearCads,
} from '../app-redux-store/export-to-cad.js';
import {
  selectSavedPrograms,
  selectAvailableCads,
  selectExportCads
} from '../app-redux-store/editor-state.js';



//8888888b.                                                          .d8888b.           888 
//888   Y88b                                                        d88P  Y88b          888 
//888    888                                                        Y88b.               888 
//888   d88P 888d888 .d88b.   .d88b.  888d888 8888b.  88888b.d88b.   "Y888b.    .d88b.  888 
//8888888P"  888P"  d88""88b d88P"88b 888P"      "88b 888 "888 "88b     "Y88b. d8P  Y8b 888 
//888        888    888  888 888  888 888    .d888888 888  888  888       "888 88888888 888 
//888        888    Y88..88P Y88b 888 888    888  888 888  888  888 Y88b  d88P Y8b.     888 
//888        888     "Y88P"   "Y88888 888    "Y888888 888  888  888  "Y8888P"   "Y8888  888 
//                                888                                                       
//                           Y8b d88P                                                       
//                            "Y88P"                                                        


const ProgramSelectionItem = ({program, onClick}) => (
  <p onClick={onClick}>{program.name}</p>
);

const ProgramSelectionPanel = () => {
  const programs = useSelector(selectSavedPrograms);
  const dispatch = useDispatch();
  return (
  <div>
    <h3>All Programs</h3>
    {programs.map(program => 
      <ProgramSelectionItem
        key={program.name}
        program={program} 
        onClick={() => dispatch(setActiveProgram({name: program.name, program: program.source}))}/>
    )}

    <h3>Search</h3>

    <h3>Recent</h3>

    <h3>Examples</h3>

  </div>
)};


// .d8888b.        d8888 8888888b.   .d8888b.           888 
//d88P  Y88b      d88888 888  "Y88b d88P  Y88b          888 
//888    888     d88P888 888    888 Y88b.               888 
//888           d88P 888 888    888  "Y888b.    .d88b.  888 
//888          d88P  888 888    888     "Y88b. d8P  Y8b 888 
//888    888  d88P   888 888    888       "888 88888888 888 
//Y88b  d88P d8888888888 888  .d88P Y88b  d88P Y8b.     888 
// "Y8888P" d88P     888 8888888P"   "Y8888P"   "Y8888  888 
//                                                          
//                                                          
//                                                          

const ActiveCadsSelector = ({availableCads, activeCads, onActiveCadsChange}) => (
  <Select 
      isMulti
      options={availableCads.map(cadName => ({label: cadName, value: cadName}))}
      value={activeCads.map(cadName => ({label: cadName, value: cadName}))}
      onChange={(vals) => onActiveCadsChange(vals ? vals.map((({value}) => value)) : [])}
      placeholder="destination CADs"
    />
);

const RunInCadPanel = () => {
  const availableCads = useSelector(selectAvailableCads);
  const activeCads = useSelector(selectExportCads);
  const dispatch = useDispatch();
  const onActiveCadsChange = (activeCads) => dispatch(setExportCads(activeCads));
  const onRunInCadClicked = () => dispatch(doExportToCads());
  const onClearCadClicked = () => dispatch(doClearCads());
  return (
  <div>
    <h3>Export to CAD</h3>
    <ActiveCadsSelector 
      activeCads={activeCads} 
      availableCads={availableCads}
      onActiveCadsChange={onActiveCadsChange}/>
    <button onClick={onRunInCadClicked}>Run in CAD</button>
    <button onClick={onClearCadClicked}>Clear CAD</button>
  </div>
  )
};


// .d8888b.  d8b      888          8888888b.                            888 
//d88P  Y88b Y8P      888          888   Y88b                           888 
//Y88b.               888          888    888                           888 
// "Y888b.   888  .d88888  .d88b.  888   d88P 8888b.  88888b.   .d88b.  888 
//    "Y88b. 888 d88" 888 d8P  Y8b 8888888P"     "88b 888 "88b d8P  Y8b 888 
//      "888 888 888  888 88888888 888       .d888888 888  888 88888888 888 
//Y88b  d88P 888 Y88b 888 Y8b.     888       888  888 888  888 Y8b.     888 
// "Y8888P"  888  "Y88888  "Y8888  888       "Y888888 888  888  "Y8888  888 
//                                                                          
//                                                                          
//                                                                          

const topBarHeight = '80px';
const programSelectionIcon = 'icons/program-selection.svg';
const runInCadIcon = 'icons/run-in-cad.svg';

const SidePanel = ({onProgramSelectionIconClicked, onRunInCadIconClicked}) => (
  <VerticalIconBar>
    <Spacer width="100%" height={topBarHeight}/>
    <IconButton icon={programSelectionIcon} onClick={onProgramSelectionIconClicked}/>
    <IconButton icon={runInCadIcon} onClick={onRunInCadIconClicked}/>
  </VerticalIconBar>
);

const SidePanelDrawers = ({activePanel}) => (
  <div className='drawer-container'>
    <Drawer open={activePanel === 'programSelection'}>
      <ProgramSelectionPanel/>
    </Drawer>
    <Drawer open={activePanel === 'runInCad'}>
      <RunInCadPanel/>
    </Drawer>
  </div>
);

const SidePanels = () => {
  const [activePanel, setActivePanel] = useState(null);
  const toggleOrMakeActive = panel => setActivePanel(activePanel === panel ? null : panel);
  return (
    <div>
        <SidePanel 
          onProgramSelectionIconClicked={() => toggleOrMakeActive('programSelection')}
          onRunInCadIconClicked={() => toggleOrMakeActive('runInCad')}/>
        <SidePanelDrawers activePanel={activePanel}/>
      </div>
  )
}


export default SidePanels;
