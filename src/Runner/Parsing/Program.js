
var esprima = require('esprima');

function programFromSourceCode(sourceCode) {
	return esprima.parse(sourceCode, {loc: true});
}

module.exports = {
	Program: {
		fromSourceCode: programFromSourceCode
	}
}