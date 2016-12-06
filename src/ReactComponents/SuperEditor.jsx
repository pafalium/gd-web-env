
import React from 'react';
import _, {partial, debounce, noop} from 'lodash';

import color from '../SceneGraph/color.js';
import ProgramEditor, {makeNodeDecoration} from './ProgramEditor.jsx';
import ResultsView, {makeResultInstanceDecoration, makeResultOcorrencesDecoration} from './ResultsView.jsx';

import {runWithTraceability, runNormally} from '../Runner/run.js';
import {getNodeResults, getResultCreatorNode} from '../Runner/run-queries.js';

import {validSource} from '../Runner/Parsing/program.js';

import time from '../utils/time.js';

/*
  Running automatically and capturing trace were joined in this component. 
  Whether to run automatically and/or capture trace can be controlled 
by the user.
*/
class SuperEditor extends React.Component {
  /*
    Props:
      - program
      - onProgramChange
    State:
      - currentProgram: the current, possibly modified, version of program
      - results
      - runAutomatically
      - captureTrace
        - traceabilityInfo
        - nodeDecorations
        - resultDecorations
  */
  constructor(props) {
    super(props);
    // Initialize bound methods.
    this.toggleRunAutomatically = this.toggleRunAutomatically.bind(this);
    this.toggleCaptureTrace = this.toggleCaptureTrace.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleProgramChange = this.handleProgramChange.bind(this);
    this.handleHoveredNode = this.handleHoveredNode.bind(this);
    this.handleHoveredResultInstance = this.handleHoveredResultInstance.bind(this);
    this.performRun = this.performRun.bind(this);
    this.scheduleRun = debounce(this.performRun, 100/*msec*/);
    // Initialize state.
    // TODO Move to initialize and update methods.
    let programResults = runWithTraceability(props.program);
    this.state = {
      currentProgram: props.program,
      runAutomatically: true,
      captureTrace: true,
      nodeDecorations: [],
      resultDecorations: [],
      programResults
    };
  }

  render() {
    return (
      <div>
        <div style={styles.controls}>
          <div onClick={this.toggleRunAutomatically} style={styles.controlsItem}>
            <input type="checkbox" checked={this.state.runAutomatically} />
            <span>Run automatically</span>
          </div>
          <div onClick={this.toggleCaptureTrace} style={styles.controlsItem}>
            <input type="checkbox" checked={this.state.captureTrace} />
            <span>Capture trace</span>
          </div>
          <div style={styles.controlsItem}>
            <button onClick={this.handleRun}>Run now</button>
          </div>
        </div>
        <div style={styles.splitParent}>
          <div style={styles.splitLeft}>
            <ProgramEditor
              program={this.state.currentProgram}
              onProgramChange={this.handleProgramChange}
              onValidProgram={noop}
              nodeDecorations={this.state.captureTrace ? this.state.nodeDecorations : []}
              onHoveredNode={this.handleHoveredNode} />
          </div>
          <div style={styles.splitRight}>
            <ResultsView
              results={this.state.programResults}
              resultDecorations={this.state.captureTrace ? this.state.resultDecorations : []}
              onHoveredResultInstance={this.state.captureTrace ? this.handleHoveredResultInstance : null} />
          </div>
        </div>
      </div>
    );
  }

  toggleRunAutomatically() {
    this.setState({runAutomatically: !this.state.runAutomatically});
  }

  toggleCaptureTrace() {
    this.setState({captureTrace: !this.state.captureTrace});
  }

  handleRun() {
    this.scheduleRun();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.program !== newProps.program) {
      this.setState({currentProgram: newProps.program});
    }
  }

  componentWillUpdate(newProps, newState) {
    const programChanged = this.state.currentProgram !== newState.currentProgram;
    const captureTraceChanged = this.state.captureTrace !== newState.captureTrace;
    const captureTraceNeeded = captureTraceChanged && newState.captureTrace;
    const programIsValid = validSource(newState.currentProgram);
    const shouldScheduleRun = newState.runAutomatically 
      && programIsValid && (programChanged || captureTraceNeeded);
    if (shouldScheduleRun) {
      this.scheduleRun();
    }
  }

  handleProgramChange(program) {
    // update the current program
    this.setState({currentProgram: program});
    // propagate change to owner component
    this.props.onProgramChange(program);
  }

  handleHoveredNode({node, path}) {
    // iff captureTrace -> highlight node (or parent) and its results
    if (this.state.captureTrace) {
      // Copied from: TraceabilityView.jsx
      let isHoveringSomething = path.length !== 0;
      if (isHoveringSomething) {
        let nodeColor = color.hsl(100.0/360.0, 0.5, 0.5);
        let nodeResults = getNodeResults(node, path, this.state.programResults);
        this.setState({
          nodeDecorations: [makeNodeDecoration(node, nodeColor)],
          resultDecorations: nodeResults.map(
            partial(makeResultOcorrencesDecoration, _, nodeColor))
        });
      } else {
        //Not hovering a node.
      }
    }
  }

  handleHoveredResultInstance({resultInstance, path}) {
    // Copied from: TraceabilityView.jsx
    let isHoveringSomething = path.length !== 0;
    if (isHoveringSomething) {
      let creatorNode = getResultCreatorNode(resultInstance, path, 
        this.state.programResults, this.state.currentProgram);
      let decColor = color.hsl(50.0/360.0, 0.5, 0.5);
      this.setState({
        nodeDecorations: [makeNodeDecoration(creatorNode, decColor)],
        resultDecorations: [makeResultInstanceDecoration(path, decColor)]
      });
    } else {
      this.setState({
        nodeDecorations: [],
        resultDecorations: []
      });
    }
  }
  
  performRun() {
    if (this.state.captureTrace) {
      let programResults = time("Traceability", () => runWithTraceability(this.state.currentProgram));
      this.setState({
        programResults
      });
    } else {
      let programResults = time("Bare run", () => runNormally(this.state.currentProgram));
      this.setState({
        programResults
      });
    }
    this.setState({
      nodeDecorations: [],
      resultDecorations: []
    });
  }
}

const styles = {
  controls: {
    display: "flex",
    alignItems: "center",
    height: "2em"
  },
  controlsItem: {
    marginLeft: "1em",
    marginRight: "1em"
  },
  splitParent: {
    display: "flex",
    height: "calc(100% - 2em)"
  },
  splitLeft: {
    width: "50%",
    height: "100%"
  },
  splitRight: {
    width: "50%",
    height: "100%"
  }
}

export default SuperEditor;
