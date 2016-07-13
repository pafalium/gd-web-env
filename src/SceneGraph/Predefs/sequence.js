
const sequence = {};
sequence.map = function(fn, seq) {
	return seq.map(fn);
};
sequence.reduce = function(fn, seq, initialValue) {
	return seq.reduce(fn, initialValue);
};
sequence.division = function(start, end, divisions) {
	// Divide directed interval defined by 'start' and 'end' into 'divisions' segments.
	//    Return return the sequence of numbers that define those segments.
	// Return a sequence of equally spaced numbers between start and end.
	// [x_1=start, ..., x_divisions, x_divisions+1=end]
	// start = 0, end = 10, 
	//   divisions = 0
	// [NaN]
	//   divisions = 1
	// [0, 10]
	//   divisions = 2
	// [0, 5, 10]
	var arr = [];
	var stepSize = (end-start) / divisions;
	var i = 0;
	while(i<divisions+1) {
		arr.push(start+stepSize*i);
		i++;
	}
	return arr;
};
/*
	@returns {Array} An array containing [a, evenlySpacedVals(n), b].
*/
sequence.cutInterval = function(a, b, n) {
	function cuts(times) {
		let spacing = (b-a)/(n+1);
		return sequence.count(times).map(i => a + (i+1)*spacing);
	}

	return [a, ...cuts(n), b];
};
sequence.intervalDivision = function(a, b, n) {
	//[x_1=start, ..., x_n=end]
	// a = 0, b = 10
	//  n = 0
	// []
	//  n = 1
	// [NaN]
	//  n = 2
	// [0, 10]
	//  n = 3
	// [0, 5, 10]
  var spacing = (b-a)/(n-1);
  var res = [];
  for(var i=0; i<n; i++) {
    res.push(a+i*spacing);
  }
  return res;
};
// Same as intervalDivision except with n=1 -> [(a+b)*0.5]
sequence.evenValsBetween = function(a, b, n) {
	if (n == 1) {
		return [a + (b-a)*0.5];
	} 

	return sequence.count(n).map(i => a + i*(b-a)/(n-1));
};
sequence.count = function(n) {
	var arr = [];
	var i = 0;
	while(i<n) {
		arr.push(i);
		i++;
	}
	return arr;
};
sequence.zip = function(...lists) {
	const smallerLength = Math.min(...lists.map(lst => lst.length));
	var arr = [];
	var i = 0;
	while(i<smallerLength) {
		arr.push(lists.map(lst => lst[i]));
		i++;
	}
	return arr;
};
sequence.cartesianProduct = function(l1, l2) {
	var arr = [];
	for(let i=0; i<l1.length; i++) {
		for(let j=0; j<l2.length; j++) {
			arr.push([l1[i], l2[j]]);
		}
	}
	return arr;
};
sequence.rotate = function(lst, offset) {
	function posModulo(dividend, divisor) {
		return ((dividend%divisor)+divisor)%divisor;
	}
	var arr = [];
	for(let i=0; i<lst.length; i++) {
		arr.push(lst[posModulo(i+offset, lst.length)]);
	}
	return arr;
};
sequence.repeatTimes = function(elem, n) {
	let i=0;
	let arr = [];
	while(i<n) {
		arr.push(elem);
		i++;
	}
	return arr;
};
sequence.concat = function(lst1, lst2) {
	return lst1.concat(lst2);
};
sequence.length = function(lst) {
	return lst.length;
};
sequence.drop = function(lst, n) {
	return lst.slice(n);
};
sequence.dropRight = function(lst, n) {
	return lst.slice(0, lst.length-n);
};


export default sequence;