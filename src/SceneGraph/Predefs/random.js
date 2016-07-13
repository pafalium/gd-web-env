
import _ from 'lodash';

const random = {};
random.inRange = function(lower, upper) {
	return _.random(lower, upper);
};
random.integer = function(upper) {
	return _.random(Math.trunc(upper));
};
random.integer.inRange = function(lower, upper) {
	return _.random(Math.trunc(lower), Math.trunc(upper));
};
random.real = function(upper) {
	return _.random(upper, true);
};
random.real.inRange = function(lower, upper) {
	return _.random(lower, upper, true);
};

export default random;