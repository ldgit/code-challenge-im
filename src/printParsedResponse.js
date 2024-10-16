import { createHmac } from "node:crypto";

/**
 * @param {string} url
 * @param {{ title: string, email: string }} parsedResponse
 */
export function printParsedResponse(url, parsedResponse) {
	const objectToPrint = { url };
	if (parsedResponse.title) {
		objectToPrint.title = parsedResponse.title;
	}

	if (parsedResponse.email) {
		// IM_SECRET env variable is guaranteed to exist.
		const hmac = createHmac("sha256", process.env.IM_SECRET);
		hmac.update(parsedResponse.email);
		objectToPrint.email = hmac.digest("hex");
	}

	console.log(JSON.stringify(objectToPrint));
}
