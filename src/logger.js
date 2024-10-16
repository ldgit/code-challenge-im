export function createSilentLogger() {
	return {
		error() {},
	};
}

export function createVerboseLogger() {
	return {
		error(error) {
			console.error(error.message);
		},
	};
}
