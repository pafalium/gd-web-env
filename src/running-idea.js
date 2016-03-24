"use strict";

var astUtils = require('./ast-utils'),
	Nodes = astUtils.constructors,
	NodeP = astUtils.recognizers,
	esprima = require('esprima'),
	estraverse = require('estraverse'),
	escodegen = require('escodegen'),
	idGenerator = require('./id-generator').idGenerator,
	nodeId = require('./node-id').nodeId;

var primitives = require('./SceneGraph/primitives');
var primitiveImportCode = generatePrimitiveImportCode(primitives);

/*results :: {(nodeId, jsValue)}*/

/*
 *	Instruments *program* to capture the results of its top-level expressions
 *	and runs it using *eval*. 
 *	The *program* has access to the primitive functions used to model in the
 *	IDE.
 *	Returns an *Object* that maps nodeIds to the results of top-level 
 *	expressions.
 */
function runProgram(program) {
	//TODO receive environment object?
	//TODO hide variables that shouldn't be available to program
	var results = new Map();
	var saveResult = function(nodeID, result) {
		results.set(nodeID, result);
	};
	(function () {
		eval(primitiveImportCode+captureResults(program));
	})();
	return results;
}

function generatePrimitiveImportCode(primitives) {
	return (
		"var " + 
		primitives.map(function(primitive, i){
			return ""+primitive.name+"="+"primitives["+i+"].fn";
		}).join(",") +
		";");
}

function captureResults(program) {
	//add code to capture top-level expression results
	var programAST = esprima.parse(program, {loc: true});
	programAST.body.forEach(function(stmt){
		if(!NodeP.isExpressionStatement(stmt)) {
			return;
		}
		stmt.expression = (
			Nodes.callExpr(
				Nodes.id("saveResult"),
				[Nodes.literal(nodeId(stmt)), stmt.expression])
			);
	});
	return escodegen.generate(programAST);
}


function runProgramPrime(program) {
	//Capture top level expression results.
	var topLevelResults = new Map();
	var saveTopLevelResult = function(nodeID, value) {
		topLevelResults.set(nodeID, value);
		return value;
	};
	
	//Capture primitive call results.
	var currentCallExpression=null;
	var primitiveCallResults = new Map();
	var savePrimitiveCallResult = function(nodeID, value) {
		if(!primitiveCallResults.has(nodeID)) {
			primitiveCallResults.set(nodeID, []);
		}
		primitiveCallResults.get(nodeID).push(value);
		return value;
	};

	//Capture expression results.
	var expressionResults = new Map();
	var saveExpressionResult = function(nodeID, value) {
		if(!expressionResults.has(nodeID)) {
			expressionResults.set(nodeID, []);
		}
		expressionResults.get(nodeID).push(value);
		return value;
	};

	var primitiveImportCode = generatePrimitiveImportCode(primitives);
	var primitiveInstrumentationCode = generatePrimitiveInstrumentationCode(primitives);
	(function(){
		eval(
			primitiveImportCode+
			primitiveInstrumentationCode+
			instrumentProgram(program));
	})();

	return {
		topLevelResults: topLevelResults,
		primitiveCallResults: primitiveCallResults,
		expressionResults: expressionResults
	};
}



function runProgramPrime2(program, transforms) {
	var programAst = esprima.parse(program, {loc: true});

	//gather nodes affected by each transform
	var nodesToInstrument = new Map(transforms.map(t=>[t,new Set()]));
	transforms.forEach(function(t){
		var transformSet = nodesToInstrument.get(t);
		estraverse.traverse(programAst, {
			enter: function(node, parent) {
				if(t.select(node, parent)) {
					transformSet.add(node);
				}
			}
		});
	});
	
	var contextIds = new Map(transforms.map(t=>[t, "ctx_"+idGenerator.next()]));
	//apply transformations, passing contextId to each for access to their context
	transforms.forEach(function(t){
		var transformSet = nodesToInstrument.get(t);
		estraverse.replace(programAst, {
			leave: function(node) {
				if(transformSet.has(node)) {
					return t.transform(node, contextIds.get(t));
				}
			}
		});
	});

	// generate program code
	var instrumentedProgram = escodegen.generate(programAst);
	
	var body = primitiveImportCode+instrumentedProgram;

	//create contexts
	var contexts = transforms.map(t=>t.makeContext());
	var args = Array.from(contextIds.values()).concat("primitives");
	var programFunction = new Function(args, body);
	programFunction.apply(null, contexts.concat([primitives]));
	return contexts;
}

/*
 * Generates code that wraps primitive functions with a function
 * that saves their results in the currentCallExpression results array.
 */
function generatePrimitiveInstrumentationCode(primitives) {
	return (
		"(function(){"+
		"var "+
		primitives.map(function(p){
			return "__"+p.name+"="+p.name;
		}).join(",") +
		";" +
		primitives.map(function(p){
			return p.name+"="+
				"function(){"+
				"var res = __"+p.name+".apply(this, arguments);" +
				"savePrimitiveCallResult(currentCallExpression, res);"+
				" return res;}"+
				";";
		}).join(" ") +
		"})();"
		);
}

function instrumentProgram(program) {
	var programAst = esprima.parse(program, {loc: true});
	//collect nodes to replace
	var topLevelExpressions = new Set();
	programAst.body.forEach(function(node){
		if(NodeP.isExpressionStatement(node)) {
			topLevelExpressions.add(node.expression);
		}
	});
	var functionCallExprs = new Set();
	estraverse.traverse(programAst, {
		enter: function(node, parent) {
			if(NodeP.isCallExpression(node)) {
				functionCallExprs.add(node);
			}
		}
	});
	var expressions = new Set();
	estraverse.traverse(programAst, {
		enter: function(node, parent) {
			if(NodeP.isExpression(node) &&
				!(NodeP.isCallExpression(parent) && 
					node === parent.callee) &&
				!(NodeP.isFunction(parent) &&
					(node === parent.id || parent.params.indexOf(node) !== -1)) &&
				!(NodeP.isUpdateExpression(parent))	&&
				!(NodeP.isVariableDeclarator(parent) &&
					node === parent.id) &&
				!(NodeP.isMemberExpression(parent) &&
					!parent.computed &&
					node === parent.property)) {
				expressions.add(node);
			}
		}
	});
	//Apply transformations.
	//top-level results
	//topLevelExpressions -> wrap with call to saveTopLevelResult
	estraverse.replace(programAst, {
		leave: function(node, parent) {
			if(topLevelExpressions.has(node)) {
				return (
						Nodes.callExpr(
							Nodes.id("saveTopLevelResult"),
							[Nodes.literal(nodeId(node)), node])
				);
			}
		}
	});
	//primitive instrumentation 
	//function calls -> set currentCallExpression before call
	//FIXME This does not work when we have nested calls.
	//	The outer primitive calls' result gets recorded in the last of its inner calls.
	/*estraverse.replace(programAst, {
		leave: function(node, parent) {
			if(functionCallExprs.has(node)) {
				return (
					Nodes.seqExpr([
						Nodes.assignExpr(
							"=",
							Nodes.id("currentCallExpression"),
							Nodes.literal(nodeId(node))),
						node
					])
				);
			}
		}
	});*/
	//expression instrumentation
	//expressions -> wrap with call to saveExpressionResult
	estraverse.replace(programAst, {
		leave: function(node, parent) {
			if(expressions.has(node)) {
				return (
					Nodes.callExpr(
						Nodes.id("saveExpressionResult"),
						[Nodes.literal(nodeId(node)), node])
				);
			}
		}
	});
	return escodegen.generate(programAst);
}


module.exports = {
	runProgram: runProgram,
	runProgramPrime: runProgramPrime,
	runProgramPrime2: runProgramPrime2
};