/**
 * @param {string} url
 */
export async function fetchUrlData(url) {
	const fullUrl =
		url.startsWith("http://") || url.startsWith("https://")
			? url
			: `https://${url}`;
	const response = await fetch(fullUrl, { method: "GET" });

	if (response.status >= 400 && response.status < 600) {
		throw new Error();
	}

  return await response.text();
}
