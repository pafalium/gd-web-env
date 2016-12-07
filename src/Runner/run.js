
import runProgram from './running-idea.js';
import {transform as traceCall} from './Instrumentation/trace-call-transform.js';
import {transform as saveTopLevel} from './Instrumentation/save-top-level-transform.js';

//
// TODO Increase cohesion of running programs. 
//	Ex: Don't return TransformRunningContexts. Return an adapter, or similar, that exposes only relevant information.
//

function runWithTraceability(program) {
	var [results, traceabilityInfo] = runProgram(
		program, [saveTopLevel, traceCall]);
	return new ProgramResults(results, traceabilityInfo);
}

//
// Run just for results.
// The results of a program are the values of its top-level expressions.
//
function run(program) {
	var [results] = runProgram(program, [saveTopLevel]);
	return new ProgramResults(results);
}

/**
	@constructor
 */
function ProgramResults(results, traceabilityInfo) {
	this.results = results;
	this.traceabilityInfo = traceabilityInfo;
}

export {run as runNormally};
export {runWithTraceability};
export {ProgramResults};
export const emptyResults = new ProgramResults(
	{topLevelExprResults: new Map()},
	{callTraces: new Map()}
);
