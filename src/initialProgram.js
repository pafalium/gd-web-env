
module.exports = "\n\nvar c1 = cylinder( 2, 5 );\n\
var s1 = sphere( 5 );\n\
move( s1, 0, 0, 10 );\n\
var b1 = box( 4, 4, 4 );\n\
var s2 = sphere( 2.5 );\n\
var gr1 = group( b1, s2 );\n\
move( gr1, 10, 0, 10 );";