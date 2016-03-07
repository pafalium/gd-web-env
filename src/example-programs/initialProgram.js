

function house(width, height, depth) {
	return group([
		box(width, height-2, depth), 
		sphere(2/1)]);
}
var c1 = cylinder( 2, 5 );
var s1 = sphere( 5 );
move( s1, 0, 0, 10 );
var b1 = box( 4, 4, 4 );
var s2 = sphere( 2.5 );
var gr1 = group([ b1, s2 ]);
move( gr1, 10, 0, 10 );
c1;
20;


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
group(cyls);
