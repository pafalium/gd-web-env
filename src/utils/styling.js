
export function join(original, additions) {
	for(var prop in additions) {
		original[prop] = additions[prop];
	}
	return original;
}

export function applyStyle(elem, style) {
	for(var prop in style) {
		elem.style[prop] = style[prop];
	}
}
