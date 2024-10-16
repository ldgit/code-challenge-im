/**
 * @param {string} url
 */
export async function fetchUrlData(url) {
	const fullUrl =
		url.startsWith("http://") || url.startsWith("https://")
			? url
			: `https://${url}`;
	await fetch(fullUrl, { method: "GET" });
}
