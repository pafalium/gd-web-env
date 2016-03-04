"use strict";

var astUtils = require('./ast-utils'),
	Nodes = astUtils.constructors,
	NodeP = astUtils.recognizers,
	esprima = require('esprima'),
	escodegen = require('escodegen');

var primitives = require('./primitives');
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
	var results = {};
	var saveResult = function(nodeID, result) {
		results[nodeID] = result;
	};
	(function () {
		"use strict";
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

function nodeId(node) {
	return JSON.stringify(node.loc);
}

module.exports = runProgram;