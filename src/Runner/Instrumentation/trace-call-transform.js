
import {constructors as Nodes, recognizers as NodeP} from '../Parsing/ast-utils.js';
import {idGenerator} from '../../id-generator.js';
import {nodeId} from '../Parsing/node-id.js';

const traceCallTransform = {
	/*
		foo.bar(a, b, c) -> 
		(function($1, $2, $3){
			var $$ = foo.bar($1, $2, $3);
			traceCall(nodeId, [$1, $2, $3], $$);
			return $$;
		})(a, b, c)
	*/
	select: function(node, parent) {
		return NodeP.isCallExpression(node);
	},
	transform: function(node, ctxId) {
		var uuid = ""+idGenerator.next();
		var argIds = node.arguments.map(function(a, i){
			return "$"+i+"_"+uuid;
		}).map(function(name){
			return Nodes.id(name);
		});
		var resId = Nodes.id("$$"+uuid);
		return Nodes.callExpr(
			Nodes.funcExpr(
				null,
				argIds,
				Nodes.block([
					Nodes.varDeclaration([
						Nodes.varDeclarator(
							resId,
							Nodes.callExpr(
								node.callee,
								argIds))],
						"var"),
					Nodes.callExpr(
						Nodes.memberExpr(
							Nodes.id(ctxId),
							Nodes.id("traceCall")),
						[Nodes.literal(nodeId(node)), Nodes.arrExpr(argIds), resId]),
					Nodes.retStmt(resId)])),
			node.arguments);
	},
	makeContext: function() {
		return {
			traceCall: function(nodeId, callArgs, callRes) {
				if(!this.callTraces.has(nodeId)) {
					this.callTraces.set(nodeId, []);
				}
				var traceEntry = {
					nodeId: nodeId, 
					arguments: callArgs, 
					result: callRes
				};
				this.callTraces.get(nodeId).push(traceEntry);
			},
			callTraces: new Map()
		};
	}
};

export {traceCallTransform as transform};
