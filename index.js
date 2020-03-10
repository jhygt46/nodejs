//var http = require('http');
/*
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://www.izusushi.cl" });
    res.end();
}).listen(80);
*/
const express = require("express");
const app = express();
app.listen(80, () => {
    console.log("El servidor está inicializado en el puerto 3000");
});
app.get('/', function (req, res) {
    res.send('Saludos desde express');
});