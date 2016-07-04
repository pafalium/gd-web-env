
const fs = require('fs');
const Program = require('../Runner/Parsing/Program.js').Program;

const exampleData = [
	["atomium.js", fs.readFileSync(__dirname + "/" + "atomium.js", "utf8")],
	["edificio_carmo.js", fs.readFileSync(__dirname + "/" + "edificio_carmo.js", "utf8")],
	["ex6_trelica_mobius.js", fs.readFileSync(__dirname + "/" + "ex6_trelica_mobius.js", "utf8")],
	["initialProgram.js", fs.readFileSync(__dirname + "/" + "initialProgram.js", "utf8")],
	["ines-wall.js", fs.readFileSync(__dirname + "/" + "ines-wall.js", "utf8")],
	["nolan-facade.js", fs.readFileSync(__dirname + "/" + "nolan-facade.js", "utf8")],
	["sheung-wan-hotel-v3.js", fs.readFileSync(__dirname + "/" + "sheung-wan-hotel-v3.js", "utf8")],
	["dom-ino-frame.js", fs.readFileSync(__dirname + "/" + "dom-ino-frame.js", "utf8")]
];

const examples = exampleData.map(
	([name,sourceCode])=>({
		program: Program.fromSourceCode(sourceCode),
		name: name
	}));

module.exports.examples = examples;