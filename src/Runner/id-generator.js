
var idIndex = 0;

module.exports = {
	idGenerator: {
		next: function() {
			idIndex += 1;
			return "$"+idIndex;
		}
	}
};