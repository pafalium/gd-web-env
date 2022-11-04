
/**
 * Execute the given 'thunk' and prints the elapsed time to the console.
 * @param {string} label Label identifying elapsed time in console
 * @param {Function} thunk Work to be timed
 */
export function time(label, thunk) {
	let t0 = performance.now();
	let res = thunk();
	let t1 = performance.now();
	console.log(label, t1-t0);
	return res;
}
