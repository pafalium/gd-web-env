
var astUtils = require('../../ast-utils'),
	Nodes = astUtils.constructors,
	NodeP = astUtils.recognizers,
	idGenerator = require('../../id-generator').idGenerator,
	nodeId = require('../../node-id').nodeId;

var saveTopLevelExprsTransform = {
	select: function(node, parent) {
		return NodeP.isExpressionStatement(node) && NodeP.isProgram(parent);
	},
	transform: function(node, ctxId) {
		return Nodes.exprStmt(
			Nodes.callExpr(
				Nodes.memberExpr(
					Nodes.id(ctxId),
					Nodes.id("saveTopLevelResult"),
					false),
				[Nodes.literal(nodeId(node)), node.expression]));
	},
	makeContext: function() {
		return {
			saveTopLevelResult: function(nodeId, value) {
				this.topLevelExprResults.set(nodeId, value);
			},
			topLevelExprResults: new Map()
		};
	}
};


module.exports = {
	transform: saveTopLevelExprsTransform
};