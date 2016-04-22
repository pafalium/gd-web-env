
var running = require("./running-idea");
var traceCall = require('./Instrumentation/trace-call-transform').transform;
var saveTopLevel = require('./Instrumentation/save-top-level-transform').transform;


function runWithTraceability(program) {
	var [results, traceabilityInfo] = running.runProgramPrime2(program, [saveTopLevel, traceCall]);
	return {results, traceabilityInfo};
}

//
//TODO Run just for results.
//
function run(program) {
	throw new Error("Not implemented");
}

module.exports = {
	normally: run,
	withTraceability: runWithTraceability
};