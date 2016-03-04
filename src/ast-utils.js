
var u = {
	isFunction: function(node) {
		return node.type === "FunctionExpression" || node.type === "FunctionDeclaration";
	},
	isReturn: function(node) {
		return node.type === "ReturnStatement";
	},
	isCallExpression: function(node) {
		return node.type === "CallExpression";
	},
	isExpressionStatement: function(node) {
		return node.type === "ExpressionStatement";
	}
};

var n = {
	exprStmt: function(expr) {
		return {
			type: "ExpressionStatement",
			expression: expr
		};
	},
	callExpr: function(calleeExpr, argExprs) {
		return {
			type: "CallExpression",
			callee: calleeExpr,
			arguments: argExprs
		};
	},
	id: function(name) {
		return {
			type: "Identifier",
			name: name
		};
	},
	literal: function(value) {
		return {
			type: "Literal",
			value: value
		};
	},
	block: function(stms) {
		return {
			type: "BlockStatement",
			body: stms
		};
	},
	funcExpr: function(id, params, body) {
		return {
			type: "FunctionExpression",
			id: id,
			params: params,
			body: body
		};
	}
};


module.exports = {
	recognizers: u,
	constructors: n
};