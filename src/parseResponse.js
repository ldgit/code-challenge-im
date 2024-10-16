import * as cheerio from "cheerio";

/**
 * @param {string} body
 * @returns {{ title: string, email: string }}
 */
export function parseResponse(body) {
	const $ = cheerio.load(body);
	const title = $("head > title").text();

	/**
	 * Used regex from "Find All Email Addresses in a File using Grep" example.
	 * @see https://emailregex.com/
	 */
	const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}\b/g;
	const emailMatches = body.match(emailRegex);

	return { title, email: emailMatches ? emailMatches[0] : "" };
}
