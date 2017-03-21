
import React, {PropTypes} from 'react';
import _, {partial, debounce, noop} from 'lodash';

import color from '../SceneGraph/color.js';
import {ColumnSplit, RowSplit, HorizontalBar, Checkbox} from './generic.jsx';
import ProgramEditor, {makeNodeDecoration} from './ProgramEditor.jsx';
import ResultsView, {makeResultInstanceDecoration, makeResultOcorrencesDecoration} from './ResultsView.jsx';

import {runWithTraceability, runNormally, emptyResults} from '../Runner/run.js';
import {getNodeResults, getResultCreatorNode} from '../Runner/run-queries.js';

import {validSource} from '../Runner/Parsing/program.js';

import time from '../utils/time.js';


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

const RunningControlsBar = ({
  autorun, 
  traceability, 
  onAutorunClick, 
  onTraceabilityClick,
  onRunClick
}) => (
  <HorizontalBar>
    <Checkbox label='Run Automatically' checked={autorun} onClick={onAutorunClick}/>
    <Checkbox label='Capture Trace' checked={traceability} onClick={onTraceabilityClick}/>
    <button onClick={onRunClick}>Run Now</button>
  </HorizontalBar>
);

const StatusBar = ({status}) => (
  <HorizontalBar>
    <span>{status}</span>
  </HorizontalBar>
);


// .d8888b.                                     8888888888     888 d8b 888                    
//d88P  Y88b                                    888            888 Y8P 888                    
//Y88b.                                         888            888     888                    
// "Y888b.   888  888 88888b.   .d88b.  888d888 8888888    .d88888 888 888888 .d88b.  888d888 
//    "Y88b. 888  888 888 "88b d8P  Y8b 888P"   888       d88" 888 888 888   d88""88b 888P"   
//      "888 888  888 888  888 88888888 888     888       888  888 888 888   888  888 888     
//Y88b  d88P Y88b 888 888 d88P Y8b.     888     888       Y88b 888 888 Y88b. Y88..88P 888     
// "Y8888P"   "Y88888 88888P"   "Y8888  888     8888888888 "Y88888 888  "Y888 "Y88P"  888     
//                    888                                                                     
//                    888                                                                     
//                    888                                                                     

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
    this.handleClickedNode = this.handleClickedNode.bind(this);
    this.handleHoveredResultInstance = this.handleHoveredResultInstance.bind(this);
    this.handleResultsViewClick = this.handleResultsViewClick.bind(this);
    this.performRun = this.performRun.bind(this);
    this.scheduleRun = debounce(this.performRun, 100/*msec*/);
    // Initialize state.
    this.state = {
      currentProgram: props.program,
      runAutomatically: true,
      captureTrace: true,
      nodeDecorations: [],
      resultDecorations: [],
      programResults: emptyResults,
      status: 'idle'
    };

    this.scheduleRun();
  }

  render() {
    return (
      <RowSplit>
        <RunningControlsBar
          autorun={this.state.runAutomatically}
          traceability={this.state.captureTrace}
          onAutorunClick={this.toggleRunAutomatically}
          onTraceabilityClick={this.toggleCaptureTrace}
          onRunClick={this.handleRun}/>
        <ColumnSplit height='calc(100% - 6em)'>
          <ProgramEditor
            program={this.state.currentProgram}
            onProgramChange={this.handleProgramChange}
            onValidProgram={noop}
            nodeDecorations={this.state.captureTrace ? this.state.nodeDecorations : []}
            onHoveredNode={noop}
            onClickedNode={this.handleClickedNode}/>
          <ResultsView
            results={this.state.programResults}
            resultDecorations={this.state.captureTrace ? this.state.resultDecorations : []}
            onClick={this.state.captureTrace ? this.handleResultsViewClick : null}/>
        </ColumnSplit>
        <StatusBar status={this.state.status}/>
      </RowSplit>
    );
    //onHoveredResultInstance={this.state.captureTrace ? this.handleHoveredResultInstance : null}
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
    let stateChanges = {};
    // update status
    stateChanges = Object.assign({}, stateChanges, { 
      status: validSource(program)
        ? 'changed'
        : 'invalid'
    });
    // update the current program
    stateChanges = Object.assign({}, stateChanges, {currentProgram: program});
    this.setState(stateChanges);
    // propagate change to owner component
    this.props.onProgramChange(program);
  }

  handleClickedNode({node, path}) {
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

  handleResultsViewClick(resClickEvent) {
    switch (resClickEvent.type) {
      case ResultsView.VoidClick:
        this.setState({
          nodeDecorations: [],
          resultDecorations: []
        });
        break;
      case ResultsView.ResultInstanceClick:
        this.handleHoveredResultInstance(resClickEvent);
        break;
      default:
        throw new Error("Unhandled ResultsView event.");
    }
  }
  
  performRun() {
    this.setState({status: 'running'});
    try {
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
      this.setState({status: 'idle'});  
    } catch (e) {
      this.setState({status: 'error:' + e.message});
    }
    this.setState({
      nodeDecorations: [],
      resultDecorations: []
    });
  }
}

SuperEditor.propTypes = {
  program: PropTypes.string.isRequired,
  onProgramChange: PropTypes.func.isRequired
};

export default SuperEditor;
