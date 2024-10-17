import { fetchUrlData as fetch } from "./fetchUrlData.js";
import { parseResponse } from "./parseResponse.js";
import { printParsedResponse } from "./printParsedResponse.js";
import { createSilentLogger } from "./logger.js";

/**
 * @param {{ requestDelay: number, retryDelay: number, fetchUrlData: (url: string) => Promise<void>, logger: { error(text): void } }} options - delay times are in milliseconds.
 * @returns object that handles url call queue.
 */
export function createCallQueue(options) {
	// Override default options with those provided through options argument, if available.
	const { requestDelay, retryDelay, fetchUrlData, logger } = {
		// 1 second
		requestDelay: 1000,
		// 1 minute
		retryDelay: 60000,
		fetchUrlData: fetch,
		logger: createSilentLogger(),
		...options,
	};
	const callQueue = new Map();
	const alreadyCalled = new Map();
	let requestDelayExpired = true;

	/**
	 * Calls the url and starts a one second timer when no other calls can be made.
	 *
	 * @param {string} url
	 */
	function callAndStartTimer(url) {
		fetchUrlData(url)
			.then((responseBody) => {
				printParsedResponse(url, parseResponse(responseBody));
			})
			.catch((error) => {
				if (!error.message.startsWith("Fetch failed with")) {
					logger.error(error);
					return;
				}

				// In case of failed fetch we retry once after retryDelay of 1 minute.
				setTimeout(() => {
					fetchUrlData(url).catch(() => {
						// If fetch fails twice log the error to stderr.
						console.error(`Http request failed for ${url}`);
					});
				}, retryDelay);
			});

		callQueue.delete(url);
		alreadyCalled.set(url);

		requestDelayExpired = false;
		setTimeout(() => {
			requestDelayExpired = true;
			callNextInQueue();
		}, requestDelay);
	}

	/** Makes a http request to next url in the call queue, if one exists. */
	function callNextInQueue() {
		const next = callQueue.entries().next().value;
		if (!next) {
			return;
		}
		callAndStartTimer(next[0]);
	}

	return {
		/** @param {string} url */
		add(url) {
			if (alreadyCalled.has(url)) {
				return;
			}

			callQueue.set(url);
			// If last (non retry) call was made more than a second ago, fetch this url immediately.
			if (requestDelayExpired) {
				callAndStartTimer(url);
			}
		},
	};
}
