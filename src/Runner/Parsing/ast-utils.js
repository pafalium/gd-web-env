"use strict";

const isExpression = (function () {
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
	return function isExpression(node) {
		return exprTypes.has(node.type);
	};
})();

function isMemberExpression(node) {
	return node.type === "MemberExpression";
}

function isVariableDeclarator(node) {
	return node.type === "VariableDeclarator";
}

function isUpdateExpression(node) {
	return node.type === "UpdateExpression";
}

function isExpressionStatement(node) {
	return node.type === "ExpressionStatement";
}

function isCallExpression(node) {
	return node.type === "CallExpression";
}

function isReturn(node) {
	return node.type === "ReturnStatement";
}

function isFunction(node) {
	return node.type === "FunctionExpression" || node.type === "FunctionDeclaration";
}

function isProgram(node) {
	return node.type === "Program";
}

function isLiteral(node) {
	return node.type === "Literal";
}

function isUnaryExpression(node) {
	return node.type === "UnaryExpression";
}

function isSignUnaryExpression(node) {
	return isUnaryExpression(node) 
		&& (node.operator === "-" || node.operator === "+");
}

function isNumericLiteral(node) {
	return isLiteral(node) && typeof node.value === "number";
}

function isSignedNumericLiteral(node) {
	return isNumericLiteral(node) 
		|| (isSignUnaryExpression(node) && isNumericLiteral(node.argument));
}

var u = {
	isExpression,
	isMemberExpression,
	isVariableDeclarator,
	isUpdateExpression,
	isExpressionStatement,
	isCallExpression,
	isReturn,
	isFunction,
	isProgram,
	isUnaryExpression,
	isSignUnaryExpression,
	isLiteral,
	isNumericLiteral,
	isSignedNumericLiteral
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
	literal: function(value, raw) {
		return {
			type: "Literal",
			value: value,
			raw
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
	},
	unaryExpr: function(operator, argument, prefix=true) {
		return {
			type: "UnaryExpression",
			operator,
			argument,
			prefix
		};
	}
};


module.exports = {
	recognizers: u,
	constructors: n
};