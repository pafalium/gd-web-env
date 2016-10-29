
//;Medidas convertidas no REVIT
const cRevit = 1.93333;
const hRevit = 0.64444;
const eRevit = 0.322;

function rightCuboid(bottom, width, height, z) {
	let p = brickMovement(bottom);
	let c1 = point.add(p, vector.byXY(-width / 2, -height / 2));
	let c2 = point.add(p, vector.byXYZ(width / 2, height / 2, z));
	return box.byCorners([c1, c2]);
}


const j = 0;
const salienciaRevit = 0.062;
function brickMovement(pt) {
	return random.integer(4) === 0
		? point.add(pt, vector.byX(salienciaRevit))
		: pt;
}

//;FUNCAO QUE CRIA QUATRO TIJOLO PEQUENOS NO ESPAÇO DE 1 TIJOLO GRANDE (30x10cm)
function brick4(p, lado, alt, e) {
	const lado2 = (lado - j) / 2.0;
	const alt2 = (alt - j) / 2.0;
	const pp = point.add(p, vector.byXY(e / 2.0, lado2 / 2.0 + j));
	const p1 = point.add(pp, vector.byY(lado2));
	const p2 = point.add(pp, vector.byZ(alt2));
	const p3 = point.add(pp, vector.byYZ(lado2, alt2));
	return [
		rightCuboid(pp, e, lado2, alt2),
		rightCuboid(p1, e, lado2, alt2),
		rightCuboid(p2, e, lado2, alt2),
		rightCuboid(p3, e, lado2, alt2)
	];
}

//;FUNCOES QUE CRIAM SO TRES TIJOLOS PEQUENOS NO ESPAÇO DE UM GRANDE
function brick3(p, lado, alt, e) {
	const lado2 = (lado - j) / 2.0;
	const alt2 = (alt - j) / 2.0;
	const pp = point.add(p, vector.byXY(e / 2.0, lado2/2.0 + j));
	const p1 = point.add(pp, vector.byY(lado2));
	//const p2 = point.add(pp, vector.byZ(alt2));
	const p3 = point.add(pp, vector.byYZ(lado2, alt2));
	return [
		rightCuboid(pp, e, lado2, alt2),
		rightCuboid(p1, e, lado2, alt2),
		rightCuboid(p3, e, lado2, alt2)
	];
}

//;FACHADA NORTE
//;DIMENSOES
const length = 12.8;
const height = 10.8;
//;;DIMENSOES BRICKS
const cBrick = 0.6;//;largura dos tijolos grandes
const hBrick = 0.2;//;altura dos tijolos grandes
const eBrick = 0.03;//;espessura dos tijolos
const nBricks = 21;//;numero em x
const mBricks = 54;//;numero em z
//;;FATORES DENSIDADE
const r50 = 2;//;para as zonas de opacidade 100%
const r100 = 4;

//;ZONA OPACA 100%
//;0m-3m dos 12.6m-17.4m e dos 25.8m-28.8m
const a1P = 5 / cBrick;

//;ZONA OPACIDADE 80%
//;dos 3-6.6m dos 9.6-12.6m dos 17.4-20.4m dos22.8-25.8m
const b0P = 7.2 / cBrick;
const b1P = 8.4 / cBrick;
const b2P = 10.2 / cBrick;
const b3P = 11.4 / cBrick;

//;FUNÇÃO PARA FAZER A PRIMEIRA E ULTIMA FILEIRA DA FACHADA
function rectExt(p, lado, alt, e, n) {
	const pts = sequence.map(
		i => point.add(p, vector.byY(lado * i)),
		sequence.count(n));
	return sequence.map(p => brick4(p, lado, alt, e), pts);
}


function rect(p, lado, alt, e, n) {
	const lado1 = lado - j;
	const alt1 = alt - j;
	const pp = point.add(p, vector.byXY(e/2.0, (j + lado)/2.0));
	const nextPoint = point.add(p, vector.byY(lado));
	if (n === 0) {
		return [];
	} else if (n < a1P) {
		return random.inRange(0, r50) < 1 
			? [
				rightCuboid(pp, e, lado1, alt1),
				rect(nextPoint, lado, alt, e, n-1)
			] 
			: random.inRange(0, 6) < 1
				? [
					brick3(p, lado, alt, e),
					rect(nextPoint, lado, alt, e, n-1)
				]
				: [
					brick4(p, lado, alt, e),
					rect(nextPoint, lado, alt, e, n-1)
				];
	} else if ((n >= b0P && n <= b1P) || (n >= b2P && n <= b3P)) {
		return random.inRange(0, r100) < 1
			? [
				rightCuboid(pp, e, lado1, alt1),
				rect(nextPoint, lado, alt, e, n-1)
			]
			: random.inRange(0, 6) <= 4
				? [
					brick3(p, lado, alt, e),
					rect(nextPoint, lado, alt, e, n-1)
				]
				: [
					brick4(p, lado, alt, e),
					rect(nextPoint, lado, alt, e, n-1)
				];
	} else {
		return random.inRange(0, r50) < 1
			? [
				brick4(p, lado, alt, e),
				rect(nextPoint, lado, alt, e, n-1)
			]
			: [
				rightCuboid(pp, e, lado, alt1),
				rect(nextPoint, lado, alt, e, n-1)
			];
	}
}


function rects(p, lado, alt, e, n, m, mMax) {
	if (m === 1) {
		return rectExt(p, lado, alt, e, n);
	} else if (m === mMax) {
		return [
			rectExt(p, lado, alt, e, n),
			rects(point.add(p, vector.byZ(alt)), lado, alt, e, n, m-1, mMax)
		];
	} else {
		return [
			rect(p, lado, alt, e, n),
			rects(point.add(p, vector.byZ(alt)), lado, alt, e, n, m-1, mMax)
		];
	}
}


rects(point.byZ(0), cRevit, hRevit, eRevit, nBricks, mBricks, mBricks);
