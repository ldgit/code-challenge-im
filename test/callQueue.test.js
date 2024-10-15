import {
	expect,
	test,
	describe,
	beforeAll,
	afterEach,
	afterAll,
	beforeEach,
	vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/network.js";
import { createCallQueue } from "../src/callQueue.js";

const nextTick = () => new Promise((resolve) => process.nextTick(resolve));

/**
 * Vitest vi.useFakeTimers() does not automatically mock process.nextTick, so we need to
 * call nextTick() after vi.advanceTimersByTime() to ensure that current event loop tasks complete.
 */
async function advanceTime(milliseconds) {
	vi.advanceTimersByTime(milliseconds);
	await nextTick();
}

beforeEach(() => vi.useFakeTimers());
beforeAll(() => server.listen());
afterEach(() => {
	server.resetHandlers();
	vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("callQueue", () => {
	test("add should immediately make a GET request to the url", async () => {
		const queue = createCallQueue();
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
		const queue = createCallQueue({ requestDelay: 1000 });
		let secondUrlCalled = false;
		let thirdUrlCalled = false;
		const firstUrlCalled = new Promise((resolve) => {
			server.use(
				http.get("https://www.google.hr", () => {
					resolve(true);
					return HttpResponse.html("<html></html>");
				}),
			);
		});
		server.use(
			http.get("https://second.example.com", () => {
				secondUrlCalled = true;
				return HttpResponse.html("<html></html>");
			}),
		);
		server.use(
			http.get("https://third.example.com", () => {
				thirdUrlCalled = true;
				return HttpResponse.html("<html></html>");
			}),
		);

		queue.add("www.google.hr");
		queue.add("https://second.example.com");
		queue.add("https://third.example.com");

		expect(await firstUrlCalled).toStrictEqual(true);
		await advanceTime(998);
		expect(secondUrlCalled).toStrictEqual(false);
		await advanceTime(3);
		expect(secondUrlCalled).toStrictEqual(true);
		await advanceTime(998);
		expect(thirdUrlCalled).toStrictEqual(false);
		await advanceTime(3);
		expect(thirdUrlCalled).toStrictEqual(true);
	});

	test("add should wait a specified amount of milliseconds before making new request (second and third urls added after some part of the delay already passed)", async () => {
		const queue = createCallQueue({ requestDelay: 1000 });
		let firstUrlCalled = false;
		let secondUrlCalled = false;
		let thirdUrlCalled = false;
		server.use(
			http.get("https://www.google.hr", () => {
				firstUrlCalled = true;
				return HttpResponse.html("<html></html>");
			}),
		);
		server.use(
			http.get("https://second.example.com", () => {
				secondUrlCalled = true;
				return HttpResponse.html("<html></html>");
			}),
		);
		server.use(
			http.get("https://third.example.com", () => {
				thirdUrlCalled = true;
				return HttpResponse.html("<html></html>");
			}),
		);

		queue.add("www.google.hr");

		await nextTick();
		expect(firstUrlCalled).toStrictEqual(true);

		await advanceTime(700);
		queue.add("https://second.example.com");
		queue.add("https://third.example.com");
		await advanceTime(298);
		expect(secondUrlCalled).toStrictEqual(false);
		await advanceTime(3);
		expect(secondUrlCalled).toStrictEqual(true);
		expect(thirdUrlCalled).toStrictEqual(false);
		await advanceTime(998);
		expect(thirdUrlCalled).toStrictEqual(false);
		await advanceTime(3);
		expect(thirdUrlCalled).toStrictEqual(true);
	});

	test("add should ignore urls that were added previously", async () => {
		const queue = createCallQueue({ requestDelay: 1000 });
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

	test.todo(
		"if a call fails wait specified amount of time and retry",
		() => {},
	);

	test.todo("failed call should only retry once", () => {});
});
