import { expect, test, describe, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/network.js";
import { fetchUrlData } from "../src/fetchUrlData.js";

beforeAll(() => {
	server.listen();
});
afterEach(() => {
	server.resetHandlers();
});
afterAll(() => {
	server.close();
});

describe("fetchUrlData", () => {
	[400, 401, 404, 451, 500, 502, 511].forEach((errorStatusCode) => {
		test(`fetchUrlData if a call fails with a http error code (${errorStatusCode}), throw error`, async () => {
			server.use(
				http.get("https://www.example.com", () => {
					return new HttpResponse(null, { status: errorStatusCode });
				}),
			);

			await expect(() =>
				fetchUrlData("www.example.com"),
			).rejects.toThrowError();
		});
	});

	test("fetchUrlData should return http response body", async () => {
		server.use(
			http.get("https://www.example.com", () => {
				return HttpResponse.html("<html><head></head><body></body></html>");
			}),
		);

		expect(await fetchUrlData("https://www.example.com")).toEqual(
			"<html><head></head><body></body></html>",
		);
	});
});
