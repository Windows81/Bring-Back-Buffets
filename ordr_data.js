const fn = "ordr.csv";
const fs = require("fs");
const menu = require("./menu_data.js");
const menu_is = Object.values(menu).map((v) => v.shortname);
const csv = require("csv-parse/lib/sync.js");
const stack = [];
const bumpd = [];

function writeData(stack, bumpd) {
	var s = stack.concat(bumpd).map((ordr) => `${ordr.tble},${menu_is.map((n) => ordr.plte[n] || 0).join(",")}\n`);
	fs.writeFileSync(fn, `tble,${menu_is.join(",")}\n${s.join("")}`, { encoding: "ascii" });
}

function appendData(ordr) {
	fs.appendFileSync(fn, `${ordr.tble},${menu_is.map((n) => ordr.plte[n] || 0).join(",")}\n`);
}

if (fs.existsSync(fn))
	for (let ordr of csv(
		fs.readFileSync(fn, "utf-8", {
			skip_empty_lines: true,
			columns: true,
		})
	)) {
		let plte = {};
		for (let n of menu_is) if (ordr[n]) plte[n] = ordr[n];
		(ordr.bump == "True" ? bumpd : stack).push({ tble: ordr.tble, plte: plte });
	}

module.exports = {
	stack: stack,
	add(...ordrs) {
		return stack.push(...ordrs);
	},
	bump(idx) {
		var i = stack.splice(idx, 1)[0];
		while (bumpd.length >= 13) bumpd.shift();
		if (i) bumpd.push(i);
		return i;
	},
	unbump() {
		var i = bumpd.pop();
		if (i) stack.unshift(i);
		return i;
	},
};
