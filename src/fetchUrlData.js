/**
 * @param {string} url
 */
export async function fetchUrlData(url) {
	const fullUrl =
		url.startsWith("http://") || url.startsWith("https://")
			? url
			: `https://${url}`;

	let response;
	try {
		response = await fetch(fullUrl, { method: "GET" });
	} catch {
		throw new Error("Fetch failed with network error.");
	}

	if (response.status >= 400 && response.status < 600) {
		throw new Error(`Fetch failed with http error code ${response.status}`);
	}

	return await response.text();
}
