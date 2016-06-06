
import React from 'react';
import ProgramEditor from './ProgramEditor.jsx';
import ResultsView from './ResultsView.jsx';
import {Program} from '../Runner/Parsing/Program.js';
import Run from '../Runner/run.js';
import {Color} from 'three';

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
    let nodeResultInstances = getNodeResultInstances(node, path, traceabilityResults);
    this.setState({
      nodeDecorations: [makeNodeDecoration(node)],
      resultInstanceDecorations: nodeResultInstances.map(makeResultInstanceDecoration)
    });
  }
  handleHoveredResultInstance({resultInstance, path}) {//unambiguous reference to a ocorrence of a result in the current program results
    //highlight node that created result
    //highlight result instance
    let isHoveringSomething = path.length !== 0;
    if(isHoveringSomething) {
      let creatorNode = getResultCreatorNode(resultInstance, path, 
        this.traceabilityResults, this.props.program);
      let color = randomColor();
      this.setState({
        nodeDecorations: [makeNodeDecoration(creatorNode, color)],
        resultInstanceDecorations: [makeResultInstanceDecoration(path, color)]
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

function noop() {}

function getResultCreatorNode(resultInstance, path, 
      traceabilityResults, program) {
  //TODO Actually get the astNode that created {resultInstance,path}.
  return program.getAST();
}
function makeNodeDecoration(creatorNode, color) {
  return {
    node: creatorNode,
    color
  };
}
function makeResultInstanceDecoration(path, color) {
  return {
    path,
    color
  };
}
function randomColor() {
  const c = new Color();
  c.setHSL(Math.random(), 0.8, 0.5);
  return c;
}

export default TraceabilityView;
