import { test } from "node:test";
import assert from "node:assert/strict";
import { extractMapEmbedUrl } from "./extractMapEmbedUrl.js";

test("extracts HTTPS src from full iframe markup", () => {
    const url = "https://www.google.com/maps/embed?pb=!1m18!2sUniversity%20of%20Otago";
    assert.equal(extractMapEmbedUrl(`<iframe src="${url}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`), url);
    assert.equal(extractMapEmbedUrl(`<iframe width='600' src='${url}'></iframe>`), url);
    assert.equal(extractMapEmbedUrl(`<iframe src=${url}></iframe>`), url);
});

test("preserves plain links and decodes escaped URL separators", () => {
    assert.equal(extractMapEmbedUrl("  https://www.google.com/maps/embed?x=1  "), "https://www.google.com/maps/embed?x=1");
    assert.equal(extractMapEmbedUrl('<iframe src="https://www.google.com/maps/embed?x=1&amp;y=2"></iframe>'), "https://www.google.com/maps/embed?x=1&y=2");
    assert.equal(extractMapEmbedUrl(""), "");
    assert.equal(extractMapEmbedUrl('<iframe src="javascript:alert(1)"></iframe>'), "");
    assert.equal(extractMapEmbedUrl('<iframe title="Map"></iframe>'), "");
});
