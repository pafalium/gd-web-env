
import esprima from 'esprima';
import escodegen from 'escodegen';

// TODO Define the model of the programs.
/*
	Immutable data structures?
		This would be cool and enforce that programs are values.
	Understand comments and integrate them in the representations.
	How to support text and structural editing?
		Keep only one representation?
		Keep both representations and keep them in sync?
		In the end there is always a valid structure.
		Only syntactically correct programs can be objects of these classes?
			Intermediate versions belong to different classes?
			Intermediate versions are handled by UI?
				Text fragments -> validate -> Program fragments
	Have a wrapper, a facade, for working with programs?
	Program
		Script
	How does the running algorithm and programs communicate?
		Running algorithm queries program about ast
		Running algorithm creates a new program with some modifications from the original
			Basically it would be a map over the program which creates a new program that is the one that will be evaluated.
			In most cases, it does have to collect some information before actually creating the new program.
	How is the running algorithm used?
		It is used to know things about the program that only become available when it runs.
			The results it generates.
			The entire execution control flow.
			The entire execution data flow.
	What can we know by looking at a program?
		The variable scoping information.
		The functions it uses, both in expression and declaration form.
		Partial information about control flow and data flow.
		How it should be run.
		We can infer types.
*/

class Program {
	getAST() {
		throw new Error("Not Implemented");
	}
	getSourceCode() {
		throw new Error("Not Implemented");
	}
	getTopLevelExpressions() {
		throw new Error("Not Implemented");
	}
	getTraversalSequence() {
		throw new Error("Not Implemented");
	}
}

class SourceCodeProgram extends Program {
	constructor(sourceCode) {
		super();
		this.ast = esprima.parse(sourceCode, {loc: true, comment: true});
		this.sourceCode = sourceCode;
	}
	getSourceCode() {
		return this.sourceCode;
	}
	getAST() {
		return this.ast;
	}
}

//Create a program by parsing a source code string.
function programFromSourceCode(sourceCode) {
	return new SourceCodeProgram(sourceCode);
}

function sourceCodefromProgram(program) {
	return escodegen.generate(program.getAST());
}

function isSyntaticallyCorrectSourceCode(sourceCode) {
	let hasCorrectSyntax;
	try {
		esprima.parse(sourceCode);
		hasCorrectSyntax = true;
	} catch(e) {
		hasCorrectSyntax = false;
	}
	return hasCorrectSyntax;
}

module.exports = {
	Program: {
		fromSourceCode: programFromSourceCode,
		toSourceCode: sourceCodefromProgram,
		isSyntaticallyCorrect: isSyntaticallyCorrectSourceCode
	}
};
