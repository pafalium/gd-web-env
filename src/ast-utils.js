"use strict";

var u = {
	isProgram: function(node) {
		return node.type === "Program";
	},
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
	},
	isUpdateExpression: function(node) {
		return node.type === "UpdateExpression";
	},
	isVariableDeclarator: function(node) {
		return node.type === "VariableDeclarator";
	},
	isMemberExpression: function(node) {
		return node.type === "MemberExpression";
	},
	isExpression: (function () {
		var exprTypes = new Set([
			"ThisExpression", 
			"ArrayExpression",
			"ObjectExpression",
			"FunctionExpression",
			"UnaryExpression",
			"UpdateExpression",
			"BinaryExpression",
			"AssignmentExpression",
			"LogicalExpression",
			"MemberExpression",
			"ConditionalExpression",
			"CallExpression",
			"NewExpression",
			"SequenceExpression",
			"Literal",
			"Identifier"
			]);
		return function(node) {
			return exprTypes.has(node.type);
		};
	})()
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
	},
	seqExpr: function(exprs) {
		return {
			type: "SequenceExpression",
			expressions: exprs
		};
	},
	assignExpr: function(op, left, right) {
		return {
			type: "AssignmentExpression",
			operator: op,
			left: left,
			right: right
		};
	},
	varDeclaration: function(declarations, kind) {
		return {
			type: "VariableDeclaration",
			declarations: declarations,
			kind: kind
		};
	},
	varDeclarator: function(id, init) {
		return {
			type: "VariableDeclarator",
			id: id,
			init: init
		};
	},
	retStmt: function(expr) {
		return {
			type: "ReturnStatement",
			argument: expr
		};
	},
	arrExpr: function(elems) {
		return {
			type: "ArrayExpression",
			elements: elems
		};
	},
	memberExpr: function(obj, prop, computed) {
		return {
			type: "MemberExpression",
			object: obj,
			property: prop,
			computed: computed
		};
	}
};


module.exports = {
	recognizers: u,
	constructors: n
};