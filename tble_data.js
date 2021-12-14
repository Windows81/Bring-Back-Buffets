const fn = "tble.csv";
const fs = require("fs");
const csv = require("csv-parse/lib/sync.js");
function validNames() {
	return Array(+process.env.table_count)
		.fill()
		.map((_, i) => i + 1 + "");
}

function writeData(data) {
	var v = Object.values(data.tbles).map((tble) => `${tble.tble},${tble.code || ""},${tble.time || ""}\n`);
	fs.writeFileSync(fn, "tble,code,time\n" + v.join(""), { encoding: "ascii" });
}

const data = {
	tbles: {},
	codes: {},
};

for (let n of validNames())
	data.tbles[n] = {
		tble: n,
		code: null,
		time: null,
	};

if (fs.existsSync(fn))
	for (t of csv(fs.readFileSync(fn, "utf8"), {
		skip_empty_lines: true,
		columns: true,
	})) {
		if (!(t.tble in data.tbles)) continue;
		data.codes[t.code] = t.tble;
		data.tbles[t.tble] = {
			tble: t.tble,
			code: t.code,
			time: +t.time,
		};
	}

function genCode(data, tble) {
	if (!(tble in data.tbles)) return [];
	var code;
	do code = String(~~(Math.random() * 10 ** 4)).padStart(4, 0);
	while (code in data.codes);
	data.codes[code] = tble;
	var t = (data.tbles[tble] = {
		tble: tble,
		code: code,
		time: Date.now(),
	});
	return [t];
}

function lookupCode(data, code) {
	var tble = data.codes[code];
	return data.tbles[tble] ? [{ tble: tble, code: code, time: data.tbles[tble].time }] : [];
}

function lookupTble(data, tble) {
	return data.tbles[tble];
}

function clean(data, cutoff = Date.now() - 36e5 * 2) {
	var a = [];
	for (let tble in data.tbles) {
		let t = data.tbles[tble];
		if (!t) continue;
		else if (t.time < cutoff) {
			delete data.codes[t.code];
			data.tbles[tble] = t = {
				tble: tble,
				code: null,
				time: null,
			};
			a.push(t);
		}
	}
	return a;
}

module.exports = {
	lookupCode(code) {
		return lookupCode(data, code);
	},
	lookupTble(tble) {
		return lookupTble(data, tble);
	},
	genCode(tble) {
		var g = genCode(data, tble);
		var c = clean(data);
		writeData(data);
		return g.concat(c);
	},
	clean(cutoff = Date.now() - 36e5 * 2) {
		var c = clean(data, cutoff);
		writeData(data);
		return c;
	},
	listTbles() {
		return Object.values(data.tbles);
	},
};
