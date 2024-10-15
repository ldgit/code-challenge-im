/**
 * Goes through the text and finds every bracket pair.
 *
 * @param {string} text
 * @returns {Array<[]>} array of "2-tuple" arrays containing the index of
 * opening and closing bracket respectively in the text.
 */
function findBracketPairs(text) {
	const brackets = text.matchAll(/\[|\]/g);

	let bracketPair = [];
	let bracketPairs = [];
	for (const bracketInfo of brackets) {
		if (bracketInfo[0] === "[") {
			if (bracketPair.length === 0) {
				bracketPair.push(bracketInfo.index);
			}
		}

		if (bracketInfo[0] === "]") {
			// A matching opening bracket without its pair exists, so we pair the closing one with it.
			if (bracketPair.length === 1) {
				bracketPair.push(bracketInfo.index);
				bracketPairs.push(bracketPair);
				bracketPair = [];
				// No matching opening bracket or all opening brackets already paired up.
			} else if (bracketPair.length === 0) {
				// The rule is "in multiple levels of brackets, only the outermost ones count".
				// So we pair this last closed bracket with the first open one in the list of
				// existing bracket pairs.
				if (bracketPairs.length > 0) {
					bracketPairs = [[bracketPairs[0][0], bracketInfo.index]];
				}
			}
		}
	}

	return bracketPairs;
}

/**
 * @param {string} text
 * @returns {Array<string>} array of urls found inside the text
 */
export function parseUrlFromText(text) {
	const textWithoutEscapedBrackets = text.replace(/(\\\[|\\\])/g, " ");

	const urls = [];
	findBracketPairs(textWithoutEscapedBrackets).forEach((bracketPair) => {
		const urlRegex =
			/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;
		const urlsInBracketPair = textWithoutEscapedBrackets
			.substring(bracketPair[0], bracketPair[1])
			.match(urlRegex);
		if (urlsInBracketPair !== null) {
			urls.push(urlsInBracketPair[urlsInBracketPair.length - 1]);
		}
	});

	return urls;
}
