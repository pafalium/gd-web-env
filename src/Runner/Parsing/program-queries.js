
import {traverse, VisitorOption} from 'estraverse';
import {property, } from 'lodash';

import {traverse as myTraverse} from './traversal.js';
import {recognizers as NodeP} from './ast-utils.js';
import {Program} from './Program.js';

export function nodesContainingCoords(program, esprimaCoords) {
  const ast = program.getAST();
  let coordsInside = nodeContainsCoord(ast, esprimaCoords);
  if (coordsInside) {
    let bottomUpNodes = [];
    let pathToDeepest = null;
    myTraverse(ast, {
      enter(node, path) {
        if (nodeContainsCoord(node, esprimaCoords)) {
          bottomUpNodes.push(node);
          pathToDeepest = path;
        }
      }
    });
    bottomUpNodes.reverse();
    return {
      bottomUpNodes,
      pathToDeepest,
      deepestNode: nodeAtPath(program, pathToDeepest)
    };
  } else {
    return {
      bottomUpNodes: [ast],
      pathToDeepest: [],
      deepestNode: ast
    };
  }
};

function _estraverse_nodesContainingCoords(program, esprimaCoords) {
  const ast = program.getAST();
  let path = [];
  traverse(ast, {
    enter(node, parent) {
      if(nodeContainsCoord(node, esprimaCoords)) {
        path.push(node);
      }
    }
  });
  path.reverse();
  return {
    path: path, 
    deepestNode: path[0]
  };
};

export function nodeContainsCoord(node, esprimaCoords) {
  function ifThen(premise, consequence) {
    return !premise || consequence;
  }
  const {start, end} = node.loc;
  let betweenLines = esprimaCoords.line >= start.line && esprimaCoords.line <= end.line;
  let onStartLine = esprimaCoords.line === start.line;
  let onEndLine = esprimaCoords.line === end.line;
  return betweenLines 
    && ifThen(onStartLine, esprimaCoords.column >= start.column)
    && ifThen(onEndLine, esprimaCoords.column <= end.column);
};

export function programNodes(program) {
  const ast = program.getAST();
  const nodes = [];
  traverse(ast, {
    enter(node, parent) {
      nodes.push(node);
    }
  });
  return nodes;
};

export function programSignedLiteralNodes(program) {
  const ast = program.getAST();
  const nodes = [];
  traverse(ast, {
    enter(node, parent) {
      if (NodeP.isSignedNumericLiteral(node)) {
        nodes.push(node);
        return VisitorOption.Skip;
      }
    }
  });
  return nodes;
};

export function nodeAtPath(program, path) {
  const ast = program.getAST();
  if (path.length !== 0) {
    return property(path)(ast);
  } else {
    return ast;
  }
};
