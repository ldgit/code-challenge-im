import * as cheerio from "cheerio";

/**
 * @param {string} body
 * @returns {{ title: string, email: string }}
 */
export function parseResponse(body) {
	const $ = cheerio.load(body);
	const title = $("head > title").text();

	/**
	 * Regex used in type=email input per WHATWG.
	 * @see https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)
	 */
	const emailRegex =
		/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
	const emailMatches = body.match(emailRegex);

	return { title, email: emailMatches ? emailMatches[0] : "" };
}
