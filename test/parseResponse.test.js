import { expect, test } from "vitest";
import { parseResponse } from "../src/parseResponse.js";

test(`parseResponse should return empty object if title and email not found`, () => {
	expect(parseResponse("<html><head></head><body></body></html>")).toEqual({
		title: "",
		email: "",
	});
});

test(`parseResponse should return title object if title found`, () => {
	expect(
		parseResponse(
			"<html><head><title>The Website</title></head><body></body></html>",
		),
	).toEqual({
		title: "The Website",
		email: "",
	});
});

test(`parseResponse should return first email found in text`, () => {
	expect(
		parseResponse(
			`
      <html>
      <head><title>The Website</title></head>
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
		title: "The Website",
		email: "first.email@example.hr",
	});
});
