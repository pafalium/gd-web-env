
import {constructors as Nodes, recognizers as NodeP} from '../Parsing/ast-utils.js';
import {nodeId} from '../Parsing/node-id.js';

const saveTopLevelExprsTransform = {
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

export {saveTopLevelExprsTransform as transform};
