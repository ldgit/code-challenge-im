import {
	expect,
	test,
	describe,
	beforeAll,
	afterEach,
	afterAll,
	vi,
	beforeEach,
} from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/network.js";
import { createCallQueue } from "../src/callQueue.js";
import { fetchUrlData } from "../src/fetchUrlData.js";

const nextTick = () => new Promise((resolve) => process.nextTick(resolve));

async function advanceTime(milliseconds) {
	await vi.advanceTimersByTimeAsync(milliseconds);
}

let consoleLogSpy;
beforeAll(() => {
	vi.stubEnv("IM_SECRET", "secret key");
	server.listen({ onUnhandledRequest: "bypass" });
});
beforeEach(() => {
	consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	vi.useFakeTimers();
});
afterEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
	server.resetHandlers();
});
afterAll(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	server.close();
});

describe("callQueue", () => {
	test("add should immediately make a GET request to the url", async () => {
		const queue = createCallQueue({ fetchUrlData });
		let urlCalled = false;
		server.use(
			http.get("https://www.google.com", () => {
				urlCalled = true;
				return HttpResponse.html("<html></html>");
			}),
		);

		queue.add("www.google.com");

		await nextTick();
		expect(urlCalled).toStrictEqual(true);
	});

	[
		["<html></html>", '{"url":"www.google.com"}', "no title or emails"],
		[
			"<html><head><title>A website</title></head></html>",
			'{"url":"www.google.com","title":"A website"}',
			"just title",
		],
		[
			"<html><body>email@example.com</body></html>",
			'{"url":"www.google.com","email":"e4ba0cf0512b11e5eba3e298a0ad3e1d1e60c247ca7b932b8d83f6d6e824d75e"}',
			"just email",
		],
	].forEach(([html, expectedJson, description]) => {
		test(`add should make a GET request to the url and print out the parsed data (${description})`, async () => {
			const queue = createCallQueue({ fetchUrlData });
			let urlCalled = false;
			server.use(
				http.get("https://www.google.com", () => {
					urlCalled = true;
					return HttpResponse.html(html);
				}),
			);

			queue.add("www.google.com");

			await nextTick();
			expect(urlCalled).toStrictEqual(true);
			await nextTick();
			expect(consoleLogSpy).toHaveBeenCalledWith(expectedJson);
		});
	});

	test("add should wait a specified amount of milliseconds before making each new requests", async () => {
		const fetchUrlDataSpy = vi.fn().mockResolvedValue("");
		const queue = createCallQueue({
			requestDelay: 1000,
			fetchUrlData: fetchUrlDataSpy,
		});

		queue.add("www.google.hr");
		queue.add("https://second.example.com");
		queue.add("https://third.example.com");

		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		expect(fetchUrlDataSpy).toHaveBeenCalledWith("www.google.hr");

		await advanceTime(998);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		await advanceTime(3);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://second.example.com",
		);

		await advanceTime(998);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		await advanceTime(3);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(3);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://third.example.com",
		);
	});

	test("add should wait a specified amount of milliseconds before making new request (second and third urls added after some part of the delay already passed)", async () => {
		const fetchUrlDataSpy = vi.fn().mockResolvedValue("");
		const queue = createCallQueue({
			requestDelay: 1000,
			fetchUrlData: fetchUrlDataSpy,
		});

		queue.add("www.google.hr");

		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("www.google.hr");
		await advanceTime(700);
		queue.add("https://second.example.com");
		queue.add("https://third.example.com");
		await advanceTime(298);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		await advanceTime(3);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://second.example.com",
		);
		await advanceTime(998);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		await advanceTime(3);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(3);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://third.example.com",
		);
	});

	test("add should ignore urls that were added previously", async () => {
		const queue = createCallQueue({ requestDelay: 1000, fetchUrlData });
		let urlCallCount = 0;
		server.use(
			http.get("https://www.google.hr", () => {
				urlCallCount += 1;
				return HttpResponse.html("<html></html>");
			}),
		);

		queue.add("www.google.hr");
		queue.add("www.google.hr");
		queue.add("www.google.hr");

		await nextTick();
		expect(urlCallCount).toEqual(1);
		await advanceTime(4000);
		expect(urlCallCount).toEqual(1);
	});

	test("if a call fails, wait specified amount of time and retry (nonexistent website)", async () => {
		let fetchUrlDataSpy = vi
			.fn()
			.mockRejectedValueOnce(new Error("Fetch failed with http error code 500"))
			.mockResolvedValue("");
		const queue = createCallQueue({ fetchUrlData: fetchUrlDataSpy });

		queue.add("https://www.nonexistentexamplewebsite.com");

		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://www.nonexistentexamplewebsite.com",
		);
		// Wait a bit so the initial fetch request fails.
		// Wait until just before the retry attempt.
		await advanceTime(59998);
		// Fetch should only be called one time (initial failed attempt).
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		await advanceTime(4);
		// Fetch should be called the second time.
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://www.nonexistentexamplewebsite.com",
		);
	});

	test("if a retried call fails, log the error to stderr", async () => {
		let fetchUrlDataSpy = vi
			.fn()
			.mockRejectedValue(new Error("Fetch failed with http error code 502"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const queue = createCallQueue({ fetchUrlData: fetchUrlDataSpy });

		queue.add("https://www.nonexistentexamplewebsite.com");

		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://www.nonexistentexamplewebsite.com",
		);
		await advanceTime(60001);
		// Fetch should be called the second time.
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		expect(fetchUrlDataSpy).toHaveBeenLastCalledWith(
			"https://www.nonexistentexamplewebsite.com",
		);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenLastCalledWith(
			"Http request failed for https://www.nonexistentexamplewebsite.com",
		);
		// Assert fetch not called again.
		await advanceTime(120001);
		expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
	});
});
