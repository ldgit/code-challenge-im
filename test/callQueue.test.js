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

beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
	server.resetHandlers();
});
afterAll(() => {
  server.close()
});

describe("callQueue", () => {
	test("add should immediately make a GET request to the url", async () => {
		const queue = createCallQueue({ fetchUrlData});
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

	test("add should wait a specified amount of milliseconds before making each new requests", async () => {
    const fetchUrlDataSpy = vi.fn().mockResolvedValue('');
		const queue = createCallQueue({ requestDelay: 1000, fetchUrlData: fetchUrlDataSpy });

		queue.add("www.google.hr");
		queue.add("https://second.example.com");
		queue.add("https://third.example.com");

    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
    expect(fetchUrlDataSpy).toHaveBeenCalledWith("www.google.hr");
    
		await advanceTime(998);
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		await advanceTime(3);
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://second.example.com");

		await advanceTime(998);
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		await advanceTime(3);
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(3);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://third.example.com");
	});

	test("add should wait a specified amount of milliseconds before making new request (second and third urls added after some part of the delay already passed)", async () => {
		const fetchUrlDataSpy = vi.fn().mockResolvedValue('');
    const queue = createCallQueue({ requestDelay: 1000, fetchUrlData: fetchUrlDataSpy });

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
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://second.example.com");
		await advanceTime(998);
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
		await advanceTime(3);
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(3);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://third.example.com");
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
    // Mocking fetchUrlData function here because MSW doesn't play nicely with fake timers and long delays.
    let fetchUrlDataSpy = vi.fn().mockRejectedValueOnce(new Error()).mockResolvedValue('')
		const queue = createCallQueue({ fetchUrlData: fetchUrlDataSpy});

		queue.add("https://www.nonexistentexamplewebsite.com");

    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://www.nonexistentexamplewebsite.com");
    // Wait a bit so the initial fetch request fails.
		// Wait until just before the retry attempt.
		await advanceTime(59998);
		// Fetch should only be called one time (initial failed attempt).
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
		await advanceTime(4);
		// Fetch should be called the second time.
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://www.nonexistentexamplewebsite.com");
	});

	test("if a retried call fails, log the error to stderr", async () => {
    let fetchUrlDataSpy = vi.fn().mockRejectedValue(new Error());
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const queue = createCallQueue({ fetchUrlData: fetchUrlDataSpy});

		queue.add("https://www.nonexistentexamplewebsite.com");

    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(1);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://www.nonexistentexamplewebsite.com");
		await advanceTime(60001);
		// Fetch should be called the second time.
    expect(fetchUrlDataSpy).toHaveBeenCalledTimes(2);
    expect(fetchUrlDataSpy).toHaveBeenLastCalledWith("https://www.nonexistentexamplewebsite.com");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenLastCalledWith("Http request failed for https://www.nonexistentexamplewebsite.com");
	});

	test.skip("if a call fails, wait specified amount of time and retry (http failure code)", async () => {
		// let urlCalled = false;
		// const queue = createCallQueue({ retryDelay: 60000 });

		// queue.add("www.nonexistentexamplewebsite.com");

		// await advanceTime(2);
		// // We create the website to confirm that the retry call was made.
		// server.use(
		// 	http.get("www.nonexistentexamplewebsite.com", () => {
		// 		urlCalled = true;
		// 		return HttpResponse.html("<html></html>");
		// 	}),
		// );
		// // Wait until just before the retry attempt.
		// await advanceTime(59996);
		// expect(urlCalled).toStrictEqual(false);
		// await advanceTime(30);
		// expect(urlCalled).toStrictEqual(true);
	});

	test.todo("failed call should only retry once", () => {});
});
