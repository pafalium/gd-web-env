
import React from 'react';
import Select from 'react-select';

import RealTimeRunEditor from './RealTimeRunEditor.jsx';
import TraceabilityView from './TraceabilityView.jsx';
import SuperEditor from './SuperEditor.jsx';
import {examples} from '../example-programs/examples.js';
import {runInCad, clearCad, selectCads} from '../Runner/run-in-cad.js';

import time from '../utils/time.js';

const traceabilityMode = "traceability";
const realtimeRunMode = "realtimeRun";
const superMode = "superEditor";
const modes = [superMode, traceabilityMode, realtimeRunMode];
const availableCads = [
	{value: "autocad", label: "AutoCAD"},
	{value: "sketchup", label: "SketchUp"}
];


class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			programs: examples,
			activeProgram: examples[0],
			activeProgramCurrentVersion: examples[0].program,
			modeIdx: 0,
			selectedCads: ["autocad"]
		};
		this.onSelectedProgram = this.onSelectedProgram.bind(this);
		this.onProgramChange = this.onProgramChange.bind(this);
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
	onCycleMode() {
		this.setState({
			modeIdx: (this.state.modeIdx+1)%modes.length
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
		const currMode = modes[this.state.modeIdx];
		const noCadSelected = this.state.selectedCads === null;
		return (
			<div style={{display: "flex"}}>
				<div style={{width: "100px", overflowX: "scroll"}}>
					<button 
						onClick={this.onRunInCad.bind(this)}
						disabled={noCadSelected}>
						Run in CAD
					</button>
					<button 
						onClick={this.onClearCad.bind(this)}
						disabled={noCadSelected}>
						Clear CAD
					</button>
					<Select 
						multi={true}
						options={availableCads}
						value={this.state.selectedCads}
						onChange={this.onSelectedCadsChange.bind(this)}
						placeholder="destination CADs"
					/>
					<ProgramSelector 
						programs={this.state.programs} 
						onSelectedProgram={this.onSelectedProgram}/>
				</div>
				<div style={{width: "calc(100% - 100px)"}}>
					{
						currMode === traceabilityMode
						? <TraceabilityView
								program={this.state.activeProgram.program}
								onProgramChange={this.onProgramChange}/>
						: currMode === realtimeRunMode 
							?	<RealTimeRunEditor
									program={this.state.activeProgram.program}
									onProgramChange={this.onProgramChange}/>
							: <SuperEditor
									program={this.state.activeProgram.program}
									onProgramChange={this.onProgramChange}/>
					}
				</div>
			</div>
		);
	}
}

class ProgramSelector extends React.Component {
	renderProgramSelector(program) {
		return (
			<li style={styles.selectors.item}
				onClick={this.props.onSelectedProgram.bind(null, program)}>
				{program.name}
			</li>
		);
	}
	render() {
		return (
			<div>
				<h2 style={styles.selectors.header}>Programs</h2>
				<ul>
					{this.props.programs.map(this.renderProgramSelector, this)}
				</ul>
			</div>
		);
	}
}

const styles = {
	selectors: {
		header: {

		},
		item: {
			
		}
	}
};

export default App;