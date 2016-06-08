
import {traverse, VisitorOption} from 'estraverse';
import {nodeId as getNodeId} from './node-id.js';

/*
	Searches for a EsprimaNode in Program's AST that has nodeId as its id.
	@param {Program} program The program to perform the search.
	@param {string} nodeId The id of the node.
	@returns {EsprimaNode|null}
*/
function getNodeById(program, nodeId) {
	let searchResult = null;
	traverse(program.getAST(), {
		enter(node, parent) {
			if(getNodeId(node) === nodeId) {
				searchResult = node;
				return VisitorOption.Break;
			}
		}
	});
	return searchResult;
}

export {getNodeById};