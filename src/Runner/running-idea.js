"use strict";

import _ from 'lodash';
import esprima from 'esprima';
import estraverse from 'estraverse';
import escodegen from 'escodegen';

import {constructors as Nodes, recognizers as NodeP} from '../ast-utils.js';
import {idGenerator} from '../id-generator.js';

import primitives, {PrimitiveProp} from '../SceneGraph/primitives.js';


const primitiveImportCode = generatePrimitiveImportCode(primitives);
function generatePrimitiveImportCode(primitives) {
	return (
		"var " + 
		primitives.map(function(primitive, i){
			return ""+primitive[PrimitiveProp]+"="+"primitives["+i+"].value";
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
	// TODO: Map nodeIds to AstNodes.
	//       - Option 1: Convert nodeIds to AstNodes after running.
	//       - Option 2: Provide a function to get the AstNode when running the program.
	//       - Option 3: Provide a function and an array with AstNodes in preorder.
	// TODO: Handle runtime exceptions.
	//
	var programAst = _.cloneDeep(program.getAST());

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