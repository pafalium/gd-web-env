
import React from 'react';
import ProgramEditor from './ProgramEditor.jsx';
import ResultsView from './ResultsView.jsx';
import {Program} from '../Runner/Parsing/Program.js';
import Run from '../Runner/run.js';

/*
Real time run view.
  Allows user to edit the program.
  Runs program as soon as the user enters a valid edit.
    Some time has passed since the last input and the program is syntatically correct.
    The user has made an atomic edit using a widget.
  Displays the results of the program afterwards.
*/
class RealTimeRunEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      program: props.program,
      results: Run.normally(props.program)
    };
  }
  componentWillReceiveProps(newProps) {
    this.setState({
      program: newProps.program,
      results: Run.normally(newProps.program)
    });
  }
  handleProgramChange(newProgram) {
    //if change was text based, wait until changes stop (debounce)
    //if change was atomic, update run and update immediately
    let runSucceeded = false;
    let results;
    try {
      results = Run.normally(newProgram);
      runSucceeded = true;
    } catch(e) {
      console.error(e);
    }
    if(runSucceeded) {
      this.setState({
        program: newProgram,
        results: results
      });
    }
  }
  render() {
    return (
      <div style={styles.parent}>
        <div style={styles.program}>
          <ProgramEditor 
            program={this.state.program} 
            onValidProgram={this.handleProgramChange.bind(this)}/>
        </div>
        <div style={styles.results}>
          <ResultsView results={this.state.results}/>
        </div>
      </div>
    );
  }
}

const styles = {
  parent: {
    display: "flex"
  },
  program: {
    width: "50%",
    height: "100%"
  },
  results: {
    width: "50%",
    height: "100%"
  }
};


export default RealTimeRunEditor;