
import {traverse, VisitorOption} from 'estraverse';
import {nodeId as getNodeId} from './node-id.js';
import {sourceToAst} from './program.js';

/*
	Searches for a EsprimaNode in Program's AST that has nodeId as its id.
	@param {Program} program The program to perform the search.
	@param {string} nodeId The id of the node.
	@returns {EsprimaNode|null}
*/
export function getNodeById(program, nodeId) {
	let searchResult = null;
	traverse(sourceToAst(program), {
		enter(node, parent) {
			if(getNodeId(node) === nodeId) {
				searchResult = node;
				return VisitorOption.Break;
			}
		}
	});
	return searchResult;
}
