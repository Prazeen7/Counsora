const { test } = require("node:test");
const assert = require("node:assert/strict");
const Program = require("./Program");
const { normalizeProgramData } = require("../utils/normalizeProgramData");
const { classifyProgramLevel } = require("../utils/programLevel");

test("new program levels survive import normalization and pass database validation", async () => {
    for (const level of ["PG Diploma", "PG Certificate", "UG Certificate"]) {
        const data = normalizeProgramData({ degree_name: "Example program", url: "https://example.org/program", level });
        assert.equal(data.level, level);
        const program = new Program(data);
        await program.validate(["level"]);
        assert.equal(program.level, level);
    }
});

test("graduate diplomas and certificate titles use the requested categories", () => {
    for (const [name, oldLevel, expected] of [
        ["Graduate Diploma in Science", "Diploma", "PG Diploma"],
        ["Postgraduate Diploma in Science", "Master", "PG Diploma"],
        ["Postgraduate Certificate in Science", "Certificate", "PG Certificate"],
        ["Graduate Certificate in Business", null, "PG Certificate"],
        ["PG Certificate in Education", "PG Diploma", "PG Certificate"],
        ["Certificate in Cookery", "Diploma", "UG Certificate"],
        ["Diploma in Science", "Diploma", "Diploma"],
    ]) {
        assert.equal(classifyProgramLevel(name, oldLevel), expected);
        assert.equal(normalizeProgramData({ degree_name: name, level: oldLevel, url: "https://example.org" }).level, expected);
    }
});
