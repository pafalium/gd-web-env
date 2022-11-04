
import React, {PropTypes} from 'react';
import Select from 'react-select';

import SuperEditor from './SuperEditor.jsx';
import {examples} from '../example-programs/examples.js';
import {runInCad, clearCad, selectCads} from '../Runner/run-in-cad.js';

import {time} from '../utils/time.js';

const defaultAvailableCads = [
	{value: "AutoCad", label: "AutoCAD"},
	{value: "SketchUp", label: "SketchUp"}
];


class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			programs: examples,
			activeProgram: examples[0],
			activeProgramCurrentVersion: examples[0].program,
			modeIdx: 0,
			selectedCads: ["AutoCad"]
		};
		this.onSelectedProgram = this.onSelectedProgram.bind(this);
		this.onProgramChange = this.onProgramChange.bind(this);
		this.onRunInCad = this.onRunInCad.bind(this);
		this.onClearCad = this.onClearCad.bind(this);
		this.onSelectedCadsChange = this.onSelectedCadsChange.bind(this);
	}

	onSelectedProgram(program) {
		this.setState({
			activeProgram: program,
			activeProgramCurrentVersion: program.program
		});
	}

	onProgramChange(newProgram) {
		this.setState({
			activeProgramCurrentVersion: newProgram
		});
	}

	onRunInCad() {
		// Call run in cad procedure
		selectCads(this.state.selectedCads);
		time("CAD export", ()=>runInCad(this.state.activeProgramCurrentVersion));
	}

	onClearCad() {
		// Call clear cad procedure
		selectCads(this.state.selectedCads);
		clearCad();
	}

	onSelectedCadsChange(selectedCads) {
		let newSelectedCads = selectedCads !== null
			? selectedCads.map(({value})=>value)
			: null;
		this.setState({
			selectedCads: newSelectedCads
		});
	}

	render() {
		return (
			<div style={{display: "flex"}}>
				<div style={{width: "100px", overflowX: "scroll"}}>
					<RunInCadControls 
						onRunInCad={this.onRunInCad}
						onClearCad={this.onClearCad}
						onSelectedCadsChange={this.onSelectedCadsChange}
						selectedCads={this.state.selectedCads}
						availableCads={defaultAvailableCads}/>
					<ProgramSelector 
						programs={this.state.programs} 
						onSelectedProgram={this.onSelectedProgram}/>
				</div>
				<div style={{width: "calc(100% - 100px)"}}>
					<SuperEditor
								program={this.state.activeProgram.program}
								onProgramChange={this.onProgramChange}/>
				</div>
			</div>
		);
	}
}


const RunInCadControls = ({ 
  onRunInCad, 
  onClearCad, 
  onSelectedCadsChange, 
  selectedCads,
  availableCads 
}) => (
  <div>
    <button 
      onClick={onRunInCad}
      disabled={selectedCads === null}>
      Run in CAD
    </button>
    <button 
      onClick={onClearCad}
      disabled={selectedCads === null}>
      Clear CAD
    </button>
    <Select 
      multi={true}
      options={availableCads}
      value={selectedCads}
      onChange={onSelectedCadsChange}
      placeholder="destination CADs"
    />
  </div>
);
RunInCadControls.propTypes = {
	onRunInCad: PropTypes.func.isRequired, 
  onClearCad: PropTypes.func.isRequired, 
  onSelectedCadsChange: PropTypes.func.isRequired, 
  selectedCads: PropTypes.array.isRequired,
  availableCads: PropTypes.array.isRequired
};


const ProgramSelectorItem = ({program, onClick}) => (
	<li onClick={onClick}>
		{program.name}
	</li>
);
ProgramSelectorItem.propTypes = {
	program: PropTypes.any.isRequired,
	onClick: PropTypes.func.isRequired
};


const ProgramSelector = ({programs, onSelectedProgram}) => (
	<div className="prog-selector">
		<h2>Programs</h2>
		<ul>
			{programs.map(program => 
				<ProgramSelectorItem program={program} 
					onClick={onSelectedProgram.bind(null, program)} />
			)}
		</ul>
	</div>
);
ProgramSelector.propTypes = {
	programs: PropTypes.array.isRequired,
	onSelectedProgram: PropTypes.func.isRequired
};


export default App;
