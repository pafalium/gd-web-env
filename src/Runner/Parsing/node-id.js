
//TODO Make module for managing(manipulating, querying) ast nodes and/or programs.
//TODO Make module for managing programs and their results.

function nodeId(node) {
	return JSON.stringify(node.loc);
}

export {nodeId};
