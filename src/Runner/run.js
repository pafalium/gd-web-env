
var running = require("./running-idea");
var traceCall = require('./Instrumentation/trace-call-transform').transform;
var saveTopLevel = require('./Instrumentation/save-top-level-transform').transform;

//
// TODO Increase cohesion of running programs. 
//	Ex: Don't return TransformRunningContexts. Return an adapter, or similar, that exposes only relevant information.
//

function runWithTraceability(program) {
	var [results, traceabilityInfo] = running.runProgramPrime2(
		program, [saveTopLevel, traceCall]);
	return {results, traceabilityInfo};
}

//
// Run just for results.
// The results of a program are the values of its top-level expressions.
//
function run(program) {
	var [results] = running.runProgramPrime2(program, [saveTopLevel]);
	return {results};
}

module.exports = {
	normally: run,
	withTraceability: runWithTraceability,
	Results: {
		emptyResults: new Map()
	}
};