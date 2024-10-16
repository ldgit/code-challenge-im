import { expect, test } from "vitest";
import { parseResponse } from "../src/parseResponse.js";

test(`parseResponse should return empty object if title and email not found`, () => {
	expect(parseResponse("<html><head></head><body></body></html>")).toEqual({
		title: "",
		emails: [],
	});
});

test(`parseResponse should return title object if title found`, () => {
	expect(
		parseResponse(
			"<html><head><title>The Website</title></head><body></body></html>",
		),
	).toEqual({
		title: "The Website",
		emails: [],
	});
});

test(`parseResponse should return all emails found in text`, () => {
	expect(
		parseResponse(
			`
      <html>
      <head></head>
      <body>
        <ul>
          <li>first.email@example.hr</li>
          <li>Two</li>
          <li class="blue">second.email@gmail.com third.email+test@gmail.com</li>
          <li class="red">four</li>
        </ul>
      </body>
      `,
		),
	).toEqual({
		title: "",
		emails: ['first.email@example.hr', 'second.email@gmail.com', 'third.email+test@gmail.com'],
	});
});
