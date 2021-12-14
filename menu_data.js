const fn = "menu.csv";
const fs = require("fs");
const csv = require("csv-parse/lib/sync.js");
var m = csv(fs.readFileSync(fn, "utf8"), {
	skip_empty_lines: true,
	columns: true,
});

require("assert").deepStrictEqual(
	Object.keys(m[0]),
	["name", "shortname", "limit", "unit", "image"],
	`${fn} does not have the correct CSV headers.`
);

module.exports = m;
