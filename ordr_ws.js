const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8081 });
const ordr = require("./ordr_data.js");
const sockets = new Set();

server.on("connection", (s) => {
	s.on("message", (m) => {
		if (!sockets.has(s)) {
			if (!process.env.code || m == process.env.code) {
				s.on("close", () => sockets.delete(s));
				sockets.add(s);
				send(ordr.stack);
			} else {
				s.close(1008, "Invalid authentication.");
			}
		} else if (m == "unbump") unbump();
		else if (m.startsWith("bump")) bump(+m.substr(4));
	});
});

function split(ordr) {
	return ordr.plte
		? [ordr]
		: Object.values(ordr.pltes).map((p) => {
				o = { ...ordr, plte: p };
				delete o.pltes;
				return o;
		  });
}

function send(addPltes = [], stkIdxs = []) {
	var d = JSON.stringify({ adds: addPltes, idxs: stkIdxs });
	for (let s of sockets) s.send(d);
}

function add(...ordrs) {
	var flat = ordrs.flatMap(split);
	var i = ordr.add(...flat);
	send(flat);
	return i;
}

function bump(idx) {
	var i = ordr.bump(idx);
	if (i) send([], [idx]);
	return i;
}

function unbump() {
	var i = ordr.unbump();
	if (i) send([i], [0]);
	return i;
}

module.exports = {
	add: add,
	bump: bump,
	unbump: unbump,
};
