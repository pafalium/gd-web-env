
function house(width, height, depth) {
	return [
		box.byWidthHeightDepth(width, height, depth), 
		sphere.byCenterRadius(
			point.byXYZ(0.0, 0.0, height/2.0), 
			Math.min(width, height)/2.0)
	];
}

translate(house(10, 20, 10)).byZ(30);

var c1 = cylinder.byRadiusHeight(2, 5);
var s1 = sphere.byRadius(5);
translate.byZ(10)(s1);
var b1 = box.byWidthHeightDepth(4, 4, 4);
var s2 = sphere.byRadius(2.5);
var gr1 = [b1, s2];
translate.byXYZ(10, 0, 10)(gr1);
c1;
20;
translate.byY(4)(c1);

var side = 500;
var num = 5000;
var cyls = [];
var i = 0;
while(i<num) {
	cyls.push(
		translate(cylinder.byRadiusHeight(2,2))
			.byXYZ(
				Math.random()*side - side*0.5, 
				Math.random()*side - side*0.5, 
				Math.random()*side - side*0.5));
	i++;
}
cyls;


var b3 = box.byWidthHeightDepth(5, 5, 5);
translate(b3).byX(20);
translate(b3).byY(30);
