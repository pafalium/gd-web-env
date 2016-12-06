
import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';

import {selectProgram, setExportCads, doExportToCads, doClearCads} from './actions-reducers.js';

//8888888                                         888                 888 
//  888                                           888                 888 
//  888                                           888                 888 
//  888   88888b.d88b.  88888b.   .d88b.  888d888 888888 .d88b.   .d88888 
//  888   888 "888 "88b 888 "88b d88""88b 888P"   888   d8P  Y8b d88" 888 
//  888   888  888  888 888  888 888  888 888     888   88888888 888  888 
//  888   888  888  888 888 d88P Y88..88P 888     Y88b. Y8b.     Y88b 888 
//8888888 888  888  888 88888P"   "Y88P"  888      "Y888 "Y8888   "Y88888 
//                      888                                               
//                      888                                               
//                      888                                               

const VerticalIconBar = ({children}) => (
  <div className="vertical-icon-bar">
    {children}
  </div>
);

const Spacer = ({width, height}) => (
  <div style={{width, height}}/>
);

const IconButton = ({icon, onClick}) => (
  <img className="icon-button" onClick={onClick} src={icon}/>
);

const Drawer = ({open, children}) => (
  <div className="drawer" style={{display: open ? 'block' : 'none'}}>
    {children}
  </div>
);


//       d8888          888                      888 
//      d88888          888                      888 
//     d88P888          888                      888 
//    d88P 888  .d8888b 888888 888  888  8888b.  888 
//   d88P  888 d88P"    888    888  888     "88b 888 
//  d88P   888 888      888    888  888 .d888888 888 
// d8888888888 Y88b.    Y88b.  Y88b 888 888  888 888 
//d88P     888  "Y8888P  "Y888  "Y88888 "Y888888 888 
//                                                   
//                                                   
//                                                   

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

const ProgramSelectionPanel = ({programs, onProgramClick}) => (
  <div>
    <h3>All Programs</h3>
    {programs.map(program => 
      <ProgramSelectionItem
        key={program.name}
        program={program} 
        onClick={() => onProgramClick(program)}/>
    )}

    <h3>Search</h3>

    <h3>Recent</h3>

    <h3>Examples</h3>

  </div>
);

const ProgramSelectionContainer = connect(
  state => ({programs: state.programs}),
  dispatch => ({onProgramClick: program => dispatch(selectProgram(program.name, program.program))})
)(ProgramSelectionPanel);


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
      multi={true}
      options={availableCads.map(cadName => ({label: cadName, value: cadName}))}
      value={activeCads}
      onChange={(vals) => onActiveCadsChange(vals ? vals.map((({value}) => value)) : [])}
      placeholder="destination CADs"
    />
);

const RunInCadPanel = ({
  availableCads, 
  activeCads, 
  onActiveCadsChange,
  onRunInCadClicked,
  onClearCadClicked
}) => (
  <div>
    <ActiveCadsSelector 
      activeCads={activeCads} 
      availableCads={availableCads}
      onActiveCadsChange={onActiveCadsChange}/>
    <button onClick={onRunInCadClicked}>Run in CAD</button>
    <button onClick={onClearCadClicked}>Clear CAD</button>
  </div>
);

const RunInCadContainer = connect(
  state => ({
    availableCads: state.availableCads, 
    activeCads: state.exportCads
  }),
  dispatch => ({
    onActiveCadsChange: (activeCads) => dispatch(setExportCads(activeCads)),
    onRunInCadClicked: () => dispatch(doExportToCads()),
    onClearCadClicked: () => dispatch(doClearCads())
  })
)(RunInCadPanel);


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
      <ProgramSelectionContainer/>
    </Drawer>
    <Drawer open={activePanel === 'runInCad'}>
      <RunInCadContainer/>
    </Drawer>
  </div>
);

class SidePanels extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activePanel: null
    };
  }

  toggleOrMakeActive(panel) {
    let {activePanel} = this.state;
    this.setState({
      activePanel: activePanel === panel ? null : panel
    });
  }

  render() {
    const {activePanel} = this.state;
    const activateProgSelectPanel = () => this.toggleOrMakeActive('programSelection');
    const activateRunInCadPanel = () => this.toggleOrMakeActive('runInCad');
    return (
      <div>
        <SidePanel 
          onProgramSelectionIconClicked={activateProgSelectPanel}
          onRunInCadIconClicked={activateRunInCadPanel}/>
        <SidePanelDrawers activePanel={activePanel}/>
      </div>
    );
  }
}


export default SidePanels;
