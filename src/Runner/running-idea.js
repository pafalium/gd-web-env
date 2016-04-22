"use strict";

var astUtils = require('../ast-utils'),
	Nodes = astUtils.constructors,
	NodeP = astUtils.recognizers,
	esprima = require('esprima'),
	estraverse = require('estraverse'),
	escodegen = require('escodegen'),
	idGenerator = require('../id-generator').idGenerator;

var primitives = require('../SceneGraph/primitives');
var primitiveImportCode = generatePrimitiveImportCode(primitives);



function generatePrimitiveImportCode(primitives) {
	return (
		"var " + 
		primitives.map(function(primitive, i){
			return ""+primitive.name+"="+"primitives["+i+"].fn";
		}).join(",") +
		";");
}

//
// ***************
// Main function!!
// ***************
//
function runProgramPrime2(program, transforms) {
	//
	// TODO: Do not change program. Change a copy instead.
	// TODO: Map nodeIds to AstNodes.
	//       - Option 1: Convert nodeIds to AstNodes after running.
	//       - Option 2: Provide a function to get the AstNode when running the program.
	//
	var programAst = program;

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



module.exports = {
	runProgramPrime2: runProgramPrime2
};