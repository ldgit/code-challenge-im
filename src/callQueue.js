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
		requestDelay: 1000,
		retryDelay: 60000,
		fetchUrlData: fetch,
		logger: createSilentLogger(),
		...options,
	};
	const callQueue = new Map();
	const alreadyCalled = new Map();
	let requestDelayExpired = true;

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
				setTimeout(() => {
					fetchUrlData(url).catch(() => {
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

	function callNextInQueue() {
		const next = callQueue.entries().next().value;
		if (!next) {
			return;
		}
		callAndStartTimer(next[0]);
	}

	return {
		/**
		 * @param {string} url
		 */
		add(url) {
			if (alreadyCalled.has(url)) {
				return;
			}

			callQueue.set(url);
			if (requestDelayExpired) {
				callAndStartTimer(url);
			}
		},
	};
}
