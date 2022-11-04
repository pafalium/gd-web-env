
var idIndex = 0;

export const idGenerator = {
	next: function() {
		idIndex += 1;
		return "$"+idIndex;
	}
};
