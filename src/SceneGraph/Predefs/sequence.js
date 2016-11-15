
const sequence = {};
sequence.map = function(fn, seq) {
	return seq.map(fn);
};
sequence.reduce = function(fn, seq, initialValue) {
	return seq.reduce(fn, initialValue);
};
/**
	Split the [start, end] interval into _divisions_ intervals.
	Take the starting values of each interval.
	If _last_ then take end value of last interval.
	@returns {Array} An array containing numbers spliting the interval
		[start,end] into _divisions_ equally sized parts, including _end_ if 
		_last_ is true.
*/
sequence.division = function(start, end, divisions, last=true) {
	let space = (end - start)/divisions;
	return sequence.count(last ? divisions+1 : divisions)
		.map(i => start + space*i);
};
/**
	Same as division(a, b, n+1, true).
	@returns {Array} An array containing [a, evenlySpacedVals(n), b].
*/
sequence.cutInterval = function(a, b, n) {
	function cuts(times) {
		let spacing = (b-a)/(n+1);
		return sequence.count(times).map(i => a + (i+1)*spacing);
	}

	return [a, ...cuts(n), b];
};
/**
	Same as cutInterval but n includes _a_ and _b_, that is, cutInterval(a, b, n-2).
	Length of return is _n_.
	Same as division(a, b, n-1, true).
*/
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
/**
	Same as intervalDivision except with n=1 -> [(a+b)*0.5].
*/
sequence.evenValsBetween = function(a, b, n) {
	if (n == 1) {
		return [a + (b-a)*0.5];
	} 

	return sequence.count(n).map(i => a + i*(b-a)/(n-1));
};
/**
	@returns {Array} An array containing the middle of all segments 
		from cutting [a, b] into _segs_ segments.
*/
sequence.intervalMiddles = function(a, b, segs) {
	let totalSpace = (b - a);
	let segmentSpace = totalSpace/segs;
	let cutPosition = segmentSpace/2;
	return sequence.count(segs).map(i => a + cutPosition + i*segmentSpace);
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
/**
	@returns {Array} An array containing all the tuples from applying
		the cartesian product to _lists_.
*/
sequence.cartesianProduct = function(...lsts) {	
	function cartAux(...lists) {
		if (lists.length > 1) {
			let [lst, ...rest] = lists;
			let smallerCartProd = cartAux(...rest);
			return smallerCartProd
				.map(tuple => lst.map(el => [el, ...tuple]))
				.reduce((prev, cur) => [...cur, ...prev], []);
		} else {
			return lists[0].map(el => [el]);
		}
	}

	return cartAux(...lsts);
	/*
	// This code should be equivalent to the above when lsts.length === 2.
	var arr = [];
	for(let i=0; i<l1.length; i++) {
		for(let j=0; j<l2.length; j++) {
			arr.push([l1[i], l2[j]]);
		}
	}
	return arr;
	*/
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
sequence.rotateLeft = sequence.rotate;
sequence.repeatTimes = function(elem, n) {
	let i=0;
	let arr = [];
	while(i<n) {
		arr.push(elem);
		i++;
	}
	return arr;
};
/**
	@returns {Array} An Array containing the elements of all _lists_
		following the order l1[0], ..., ln[0], ..., l1[m], ..., lk[m],
		where lk is the list before first list that lacks the mth element.
*/
sequence.interleave = function interleave(...lists) {
	let res = [];
	let smallestLength = Math.min.apply(null, lists.map(lst => lst.length));
	for (let j = 0; j < smallestLength; j++) {
		for (let i = 0; i<lists.length; i++) {
			res.push(lists[i][j]);
		}
	}
	for (let i = 0; lists[i].length !== smallestLength; i++) {
		res.push(lists[i][smallestLength]);
	}
	return res;
};
sequence.concat = function(...lists) {
	return [].concat(...lists);
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