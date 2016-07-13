
import React from 'react';

import RealTimeRunEditor from './RealTimeRunEditor.jsx';
import TraceabilityView from './TraceabilityView.jsx';
import SuperEditor from './SuperEditor.jsx';
import {examples} from '../example-programs/examples.js';
const traceabilityMode = "traceability";
const realtimeRunMode = "realtimeRun";
const superMode = "superEditor";
const modes = [superMode, traceabilityMode, realtimeRunMode];

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			programs: examples,
			activeProgram: examples[0]
			modeIdx: 0,
		};
		this.onSelectedProgram = this.onSelectedProgram.bind(this);
		this.onProgramChange = this.onProgramChange.bind(this);
	}
	onSelectedProgram(program) {
		this.setState({
			activeProgram: program
		});
	}
	onProgramChange(newProgram) {
		// do nothing, for now...
	}
	render() {
		const currMode = modes[this.state.modeIdx];
		return (
			<div style={{display: "flex"}}>
				<div style={{width: "100px", overflowX: "scroll"}}>
					<button onClick={this.onCycleMode.bind(this)}>Cycle Mode</button>
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
				<p style={styles.selectors.header}>Programs</p>
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