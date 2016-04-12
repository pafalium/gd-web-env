

function house(width, height, depth) {
	return [
		box(width, height, depth), 
		move(sphere(Math.min(width, height)/2.0), 0, 0, height/2.0)
	];
}

move(house(10, 20, 10), 0, 0, 30);

var c1 = cylinder(2, 5);
var s1 = sphere(5);
move(s1, 0, 0, 10);
var b1 = box(4, 4, 4);
var s2 = sphere(2.5);
var gr1 = [b1, s2];
move(gr1, 10, 0, 10);
c1;
20;
move(c1, 0, 4, 0);

var side = 500;
var num = 5000;
var cyls = [];
var i = 0;
while(i<num) {
	cyls.push(
		move(cylinder(2,2), 
			Math.random()*side - side*0.5, 
			Math.random()*side - side*0.5, 
			Math.random()*side - side*0.5));
	i++;
}
cyls;


var b3 = box(5,5,5);
move(b3, 20, 0, 0);
move(b3, 0, 30, 0);