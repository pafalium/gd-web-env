
module.exports = "\n\n\
function house(width, height, depth) {\n\
	return group([\n\
		box(width, height-2, depth), \n\
		sphere(2/1)]);\n\
}\n\
var c1 = cylinder( 2, 5 );\n\
var s1 = sphere( 5 );\n\
move( s1, 0, 0, 10 );\n\
var b1 = box( 4, 4, 4 );\n\
var s2 = sphere( 2.5 );\n\
var gr1 = group([ b1, s2 ]);\n\
move( gr1, 10, 0, 10 );\n\
c1;\n\
20;";
