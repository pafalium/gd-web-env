
function nodeId(node) {
	return JSON.stringify(node.loc);
}

module.exports = {
	nodeId: nodeId
};