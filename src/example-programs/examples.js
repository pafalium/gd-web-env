
//Note: These example files are read in build-time with 'brfs'.
import {readFileSync} from 'fs';

const exampleData = [
	["atomium.js", readFileSync(__dirname + "/" + "atomium.js", "utf8")],
	["edificio_carmo.js", readFileSync(__dirname + "/" + "edificio_carmo.js", "utf8")],
	["ex6_trelica_mobius.js", readFileSync(__dirname + "/" + "ex6_trelica_mobius.js", "utf8")],
	["initialProgram.js", readFileSync(__dirname + "/" + "initialProgram.js", "utf8")],
	["ines-wall.js", readFileSync(__dirname + "/" + "ines-wall.js", "utf8")],
	["nolan-facade.js", readFileSync(__dirname + "/" + "nolan-facade.js", "utf8")],
	["sheung-wan-hotel-v3.js", readFileSync(__dirname + "/" + "sheung-wan-hotel-v3.js", "utf8")],
	["dom-ino-frame.js", readFileSync(__dirname + "/" + "dom-ino-frame.js", "utf8")],
	["cruzeta.js", readFileSync(__dirname + "/" + "cruzeta.js", "utf8")],
	["column.js", readFileSync(__dirname + "/" + "column.js", "utf8")],
	["coneSphere.js", readFileSync(__dirname + "/" + "coneSphere.js", "utf8")],
	["cities.js", readFileSync(__dirname + "/" + "cities.js", "utf8")]
];

export const examples = exampleData.map(
	([name, sourceCode])=>({
		name: name,
		program: sourceCode
	}));
