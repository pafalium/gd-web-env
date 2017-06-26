
//nolan facade

const lQuads = 1, //aresta dos quadrados
	m = lQuads/5, //margens laterais dos paineis
	i = lQuads/10, //margens entre quadrados
	nQuad = 30, //numero de quadrados
	width = m + m +  3*i + 4*lQuads, //altura dos paineis
	height = nQuad*lQuads + (nQuad - 1)*i; //largura de cada painel

const surfaceRectangle = rectangle.surface.byCornerWidthHeight;
const zAxisAt = pt => axis.byPointVector(pt, vector.byZ(1));
const yAxisAt = pt => axis.byPointVector(pt, vector.byY(1));

function nolanFaixa(p, n, l, angMax) {
  const freq = 0.06, //Se for > que 0.07 a rotação é começa-se a notar a 1/2 dos paineis.Caso seja < nota-se antes do meio
        a = Math.min(0,
               Math.max(-Math.PI/2,
                    -angMax * Math.sin(Math.PI/2 - freq*n))),
        p1 = point.add(p, vector.byX(m)),
        p11 = point.add(p, vector.byXY(m, l)),
        p2 = point.add(p1, vector.byX(l + i)),
        p3 = point.add(p2, vector.byX(l + i)),
        p4 = point.add(p3, vector.byX(l + i));
    return n === 0
        ? []
        : [
			rotate(
				rotate(surfaceRectangle(p1, [l, l]))
					.aroundAxisByAngle(yAxisAt(p1), a))
				.aroundAxisByAngle(
					zAxisAt(point.add(p1, vector.byXY(l/2, l/2))), 
					random.integer(4)*Math.PI/2),
			rotate(
				rotate(surfaceRectangle(p2, [l, l]))
					.aroundAxisByAngle(yAxisAt(p2), a))
				.aroundAxisByAngle(
					zAxisAt(point.add(p2, vector.byXY(l/2, l/2))), 
					random.integer(4)*Math.PI/2),
			rotate(
				rotate(surfaceRectangle(p3, [l, l]))
					.aroundAxisByAngle(yAxisAt(p3), a))
				.aroundAxisByAngle(
					zAxisAt(point.add(p3, vector.byXY(l/2, l/2))), 
					random.integer(4)*Math.PI/2),
			rotate(
				rotate(surfaceRectangle(p4, [l, l]))
					.aroundAxisByAngle(yAxisAt(p4), a))
				.aroundAxisByAngle(
					zAxisAt(point.add(p4, vector.byXY(l/2, l /2))), 
					random.integer(4)*Math.PI/2),
			nolanFaixa(point.add(p, vector.byY(l+i)), n-1, l, angMax)
		];
}

function nolanPainel(p, n, l, angMax) {
	return [
		box.byCorners([p, point.add(p, vector.byXYZ(width, height, -width))]),
		nolanFaixa(p, n, l, angMax)
	];
}


function nolanPattern(p, n, nFaixas, l, angMax) {
	const d = l/2,
		ampSinusoide = 0.01, //amplitude varies between 0.01 and 0.15
		freqSinusoide = 0.5,
  		aSinusoide = ampSinusoide + ampSinusoide*Math.sin(freqSinusoide*nFaixas);
    return nFaixas === 0
        ? []
        : [
			rotate(nolanPainel(p, n, l, angMax))
				.aroundAxisByAngle(
					axis.byPointVector(p, vector.byX(1)), 
					aSinusoide),
			nolanPattern(point.add(p, vector.byX(width + d)), n, nFaixas - 1, l, angMax)
        ];
}


rotate(nolanPattern(point.byXYZ(0, 0, 0), nQuad, 25, lQuads, Math.PI/6))
	.aroundAxisByAngle(
		axis.byPointVector(point.byXYZ(0,0,0), vector.byX(1)), 
		Math.PI/2);
