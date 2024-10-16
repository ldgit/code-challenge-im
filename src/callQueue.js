import { fetchUrlData as fetch } from "./fetchUrlData.js";

/**
 * @param {{ requestDelay: number, retryDelay: number, fetchUrlData: (url: string) => Promise<void> }} options - delay times are in milliseconds.
 * @returns object that handles url call queue.
 */
export function createCallQueue(options) {
	// Override default options with those provided through options argument, if available.
	const { requestDelay, retryDelay, fetchUrlData } = {
		requestDelay: 1000,
		retryDelay: 60000,
		fetchUrlData: fetch,
		...options,
	};
	const callQueue = new Map();
	const alreadyCalled = new Map();
	let requestDelayExpired = true;

	function callAndStartTimer(url) {
		fetchUrlData(url).catch(() => {
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
