
import React from 'react';

import RealTimeRunEditor from './RealTimeRunEditor.jsx';
import {examples} from '../example-programs/examples.js';

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			programs: examples,
			activeProgram: examples[0]
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
		return (
			<div>
				<ProgramSelector 
					programs={this.state.programs} 
					onSelectedProgram={this.onSelectedProgram}/>
				<RealTimeRunEditor
					program={this.state.activeProgram.program}
					onProgramChange={this.onProgramChange}/>
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