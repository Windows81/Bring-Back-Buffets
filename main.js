const menu = require("./menu_data.js");
const tble = require("./tble_data.js");
const ordr = require("./ordr_ws.js");
const http = require("http");
const path = require("path");
const url = require("url");
const fs = require("fs");
const code = process.env.code;

function checkAuth(req, res) {
	var as = req.headers.authorization || "";
	if (code) {
		var auth = Buffer.from(as.substr(6), "base64").toString();
		if (!auth.endsWith(`:${code}`)) {
			res.writeHead(401, { "WWW-Authenticate": "BASIC" });
			res.end("HTTP Error 401 Unauthorized: Access is denied");
			return false;
		} else res.setHeader("auth-code", code);
	}
	return true;
}

http
	.createServer((req, res) => {
		var u = url.parse(req.url, true);
		switch (u.pathname) {
			case "/robots.txt": {
				res.end("User-agent: *\nDisallow: /");
				break;
			}
			case "/cashier": {
				if (checkAuth(req, res)) res.end(fs.readFileSync("cash.html"));
				break;
			}
			case "/":
			case "/index.html": {
				res.statusCode = 302;
				res.setHeader("Location", "/menu");
				res.end();
				break;
			}
			case "/menu": {
				res.end(fs.readFileSync("menu.html"));
				break;
			}
			case "/display": {
				if (checkAuth(req, res)) res.end(fs.readFileSync("disp.html"));
				break;
			}
			case "/ls_menu": {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(menu));
				break;
			}
			case "/ls_tbles": {
				if (checkAuth(req, res)) {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify(tble.listTbles()));
					break;
				}
			}
			case "/lkp_tble": {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(tble.lookupTble(u.query.tble)));
				break;
			}
			case "/lkp_code": {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(tble.lookupCode(u.query.code)));
				break;
			}
			case "/gen_code": {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(tble.genCode(u.query.tble)));
				break;
			}
			case "/snd_ordr": {
				let bs = [];
				req.on("data", (b) => bs.push(b));
				req.on("end", () => {
					var c = Buffer.concat(bs);
					var o = JSON.parse(c);
					if (o.code == tble.lookupTble(o.tble).code) {
						ordr.add(o);
						res.end();
					} else {
						res.writeHead(401);
						res.end("HTTP Error 401 Unauthorized: Invalid/expired order code");
					}
				});
				break;
			}
			default: {
				if (req.url.startsWith("/add/")) {
					tble.genCode(req.url.substr(5));
				} else {
					var p = path.join("/img", req.url);
					if (fs.existsSync(p)) fs.createReadStream(p).pipe(res);
					else {
						res.statusCode = 404;
						res.end();
					}
				}
			}
		}
	})
	.listen(process.env.PORT);
