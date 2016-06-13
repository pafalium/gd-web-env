
import React from 'react';
import {Color} from 'three';
import _, {noop, partial} from 'lodash';
import ProgramEditor, {NodeDecoration} from './ProgramEditor.jsx';
import ResultsView, {ResultInstanceDecoration, ResultOcorrencesDecoration} from './ResultsView.jsx';

import Run from '../Runner/run.js';
import {getNodeResults, getResultCreatorNode} from '../Runner/run-queries.js';

class TraceabilityView extends React.Component {
  constructor(props) {
    super(props);
    //Initialize bound methods.
    this.handleHoveredNode = this.handleHoveredNode.bind(this);
    this.handleHoveredResultInstance = this.handleHoveredResultInstance.bind(this);
    //Initialize state.
    this.state = {
      traceabilityResults: Run.withTraceability(props.program),
      nodeDecorations: [],
      resultInstanceDecorations: []
    };
  }
  componentWillReceiveProps(newProps) {
    this.setState({
      traceabilityResults: Run.withTraceability(newProps.program),
      nodeDecorations: [],
      resultInstanceDecorations: []
    });
  }
  handleHoveredNode({node, path}) {//unambiguous reference to a program node of the current program
    //highlight results of node
    //highlight node
    let isHoveringSomething = path.length !== 0;
    if(isHoveringSomething) {
      let nodeColor = color.hsl(100.0/360.0, 0.5, 0.5);
      let nodeResults = getNodeResults(node, path, this.state.traceabilityResults);
      this.setState({
        nodeDecorations: [makeNodeDecoration(node, nodeColor)],
        resultInstanceDecorations: nodeResults.map(partial(makeResultOcorrencesDecoration, _, nodeColor))
      });
    } else {
      //Not hovering a node.
    }
  }
  handleHoveredResultInstance({resultInstance, path}) {//unambiguous reference to a ocorrence of a result in the current program results
    //highlight node that created result
    //highlight result instance
    let isHoveringSomething = path.length !== 0;
    if(isHoveringSomething) {
      let creatorNode = getResultCreatorNode(resultInstance, path, 
        this.state.traceabilityResults, this.props.program);
      let decColor = color.hsl(50.0/360.0, 0.5, 0.5);
      this.setState({
        nodeDecorations: [makeNodeDecoration(creatorNode, decColor)],
        resultInstanceDecorations: [makeResultInstanceDecoration(path, decColor)]
      });
    } else {
      this.setState({
        nodeDecorations: [],
        resultInstanceDecorations: []
      });
    }
    
  }
  render() {
    return (
      <div style={styles.parent}>
        <div style={styles.program}>
          <ProgramEditor 
            program={this.props.program} 
            //node decorations [{node, color}]
            nodeDecorations={this.state.nodeDecorations}
            onValidProgram={noop}
            onHoveredNode={this.handleHoveredNode}/>
        </div>
        <div style={styles.results}>
          <ResultsView 
            results={this.state.traceabilityResults}
            //result instance decorations[{resultInstance, color}]
            resultInstanceDecorations={this.state.resultInstanceDecorations}
            onHoveredResultInstance={this.handleHoveredResultInstance}/>
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


function makeNodeDecoration(node, color) {
  return new NodeDecoration(node, color);
}
function makeResultInstanceDecoration(path, color) {
  return new ResultInstanceDecoration(path, color);
}
function makeResultOcorrencesDecoration(result, color) {
  return new ResultOcorrencesDecoration(result, color);
}


function randomColor() {
  const c = new Color();
  c.setHSL(Math.random(), 0.8, 0.5);
  return c;
}
function colorByHSL(hue, saturation, lightness) {
 const c = new Color();
  c.setHSL(hue, saturation, lightness);
  return c; 
}
const color = {};
color.random = randomColor;
color.hsl = colorByHSL;


export default TraceabilityView;
