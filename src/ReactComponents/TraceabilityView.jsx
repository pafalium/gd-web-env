
import React from 'react';
import {Color} from 'three';
import _, {noop, partial} from 'lodash';
import ProgramEditor, {NodeDecoration} from './ProgramEditor.jsx';
import ResultsView, {ResultInstanceDecoration, ResultOcorrencesDecoration} from './ResultsView.jsx';
import {Program} from '../Runner/Parsing/Program.js';
import {getNodeById} from '../Runner/Parsing/getNodeById.js';
import {nodeId} from '../Runner/Parsing/node-id.js';
import Run from '../Runner/run.js';

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


/*
  ========Run captured information:=============
  toplevelresults :: AstNode -> ProgramResult
  tracecall :: AstNode -> [CallTraceElement]
    CallTraceElement :: (AstNode, [ProgramResult], ProgramResult)
*/
/*
  I got a path to a specific use of a result. 
  path: [leaf, father, grandfather]
  I want to know which AstNode was the creator of the result closest to leaf.
  
  It is garantied to have been returned by a node, unless it is a 
predefined or primitive value.

  The path may contain results that were not returned by themselves 
but through their parents.
  We have to find the first result of path that was returned by a node.
  There may be several nodes that returned the result. We want to return
the first node that returned it.

  Javascript Map iteration follows insertion order. This leads to:
    - When iterating through traceabilityInfo.callTraces, we visit nodes 
  ordered by the first time they were executed. 
      - In a function call: arguments -> body -> return
    - Each node's callTraces are visited by criation/execution order.
*/
function getResultCreatorNode(resultInstance, path, 
      traceabilityResults, program) {
  function returnerNodes(result) {
    const returnsResult = ([node,callTraces]) => callTraces.some(c=>c.result===result);
    let nodesCallTraces = Array.from(traceabilityResults.traceabilityInfo.callTraces.entries());
    return nodesCallTraces
      .filter(returnsResult)
      .map(([node,callTrace])=>getNodeById(program, node));
  }
  function wasReturnedByNode(result) {
    return returnerNodes(result).length !== 0;
  }
  //Find the first result of path that was returned nodes.
  //Return the first node that returned that result.
  //TODO FIXME Garanty that the returned node is actually the one that created the result.
  let currentResultIdx = 0;
  while(currentResultIdx < path.length) {
    let currentResult = path[currentResultIdx];
    let returners = returnerNodes(currentResult);
    if(returners.length !== 0) {
      return returners[0];
    }
    currentResultIdx++;
  }
  //Otherwise, default to the node that represent the whole program.
  return program.getAST();
}
function getNodeResults(node, path, traceabilityResults) {
  //TODO getNodeResults() -> Get results of more than call expressions.
  const nodeIdToCallTraces = traceabilityResults.traceabilityInfo.callTraces;
  let nodesWithResults = path.filter(
    node => nodeIdToCallTraces.has(nodeId(node)));
  if(nodesWithResults.length > 0) {
    let callTracesOfFirst = nodeIdToCallTraces.get(nodeId(nodesWithResults[0]));
    let resultsOfFirst = callTracesOfFirst.map(callTrace => callTrace.result);
    return resultsOfFirst;
  } else {
    return [];
  }
}


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
