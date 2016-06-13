
import {nodeId} from './Parsing/node-id.js';
import {getNodeById} from './Parsing/getNodeById.js';

// dependencies: run.withTraceability + Program

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
function getResultCreatorNode(resultInstance, path, traceabilityResults, program) {
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

export {getResultCreatorNode, getNodeResults};
