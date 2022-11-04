
import _ from 'lodash';
import esprima from 'esprima';
import estraverse from 'estraverse';
import escodegen from 'escodegen';


import {constructors as Nodes, recognizers as NodeP} from './Parsing/ast-utils.js';
import {sourceToAst} from './Parsing/program.js';
import {idGenerator} from './id-generator.js';

import primitives from '../SceneGraph/primitives.js';

/**
 * @typedef {object} Transform - A program transformation
 * @prop {(node: any, parent: any) => boolean} select - Selector for AST nodes affected by the transform
 * @prop {(node: any, ctxId: string) => any} transform - Returns the transformed version of the given AST node
 * @prop {() => object} makeContext - Creates context variables/functions required by the transformation
 */
/**
 * @typedef {object} Binding - A primitive binding (name and value)
 * @property {string} name
 * @property {any} value - The primitive's function, value, or namespace object.
 */


/**
 * Runs the *program*, applying the given *tranforms*.
 *  The program has access to bindings from *predefinedBindings*.
 * @param {string} program 
 * @param {Transform[]} transforms 
 * @param {Binding[]} predefinedBindings 
 * @returns {object[]} List of transform contexts after running the program
 */
function runProgram(program, transforms, predefinedBindings=primitives) {
	//
	// TODO: Map nodeIds to AstNodes.
	//       - Option 1: Convert nodeIds to AstNodes after running.
	//       - Option 2: Provide a function to get the AstNode when running the program.
	//       - Option 3: Provide a function and an array with AstNodes in preorder.
	// TODO: Handle runtime exceptions.
	//
	var programAst = _.cloneDeep(sourceToAst(program));

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
	const primitivesId = "primitives";
	var primitiveImportCode = generatePrimitiveImportCode(predefinedBindings, primitivesId);
	var instrumentedProgram = escodegen.generate(programAst);
	
	var body = primitiveImportCode+instrumentedProgram;

	//create contexts and actually run the program
	var contexts = transforms.map(t=>t.makeContext());
	var args = Array.from(contextIds.values()).concat(primitivesId);
	var programFunction = new Function(args, body);
	programFunction.apply(null, contexts.concat([predefinedBindings]));

	return contexts;
}

function generatePrimitiveImportCode(primitives, primitivesId) {
	return (
		"var " 
		+ primitives.map(function(primitive, i){
				return ""+primitive.name+"="+primitivesId+"["+i+"].value";
			}).join(",") 
		+	";\n");
}

export default runProgram;
export {runProgram};
