
function time(label, thunk) {
	let t0 = performance.now();
	let res = thunk();
	let t1 = performance.now();
	console.log(label, t1-t0);
	return res;
}

export default time;
