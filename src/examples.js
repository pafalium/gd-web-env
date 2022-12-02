
import { createProgram } from "./app-redux-store/programs";


function fetchCode(url) {
	return fetch(url).then(resp => resp.text())
}

export const exampleData = [
	{name: "atomium.js", sourceCode: fetchCode("./example-programs/atomium.js")},
	{name: "edificio_carmo.js", sourceCode: fetchCode("./example-programs/edificio_carmo.js")},
	{name: "ex6_trelica_mobius.js", sourceCode: fetchCode("./example-programs/ex6_trelica_mobius.js")},
	{name: "initialProgram.js", sourceCode: fetchCode("./example-programs/initialProgram.js")},
	{name: "ines-wall.js", sourceCode: fetchCode("./example-programs/ines-wall.js")},
	{name: "nolan-facade.js", sourceCode: fetchCode("./example-programs/nolan-facade.js")},
	{name: "sheung-wan-hotel-v3.js", sourceCode: fetchCode("./example-programs/sheung-wan-hotel-v3.js")},
	{name: "dom-ino-frame.js", sourceCode: fetchCode("./example-programs/dom-ino-frame.js")},
	{name: "cruzeta.js", sourceCode: fetchCode("./example-programs/cruzeta.js")},
	{name: "column.js", sourceCode: fetchCode("./example-programs/column.js")},
	{name: "coneSphere.js", sourceCode: fetchCode("./example-programs/coneSphere.js")},
	{name: "cities.js", sourceCode: fetchCode("./example-programs/cities.js")}
];

export function loadExamples(reduxStore) {
  //Add programs as they arrive
  let loads = exampleData.map(({name, sourceCode})=>
	sourceCode.then(source =>
		reduxStore.dispatch(createProgram({name, source}))))
  //Return promise when all are loaded
  return Promise.all(loads);
}
