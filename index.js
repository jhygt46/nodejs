var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://www.izusushi.cl" });
    res.end();
}).listen(80);