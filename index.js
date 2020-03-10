//var http = require('http');
/*
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://www.izusushi.cl" });
    res.end();
}).listen(80);
*/
const express = require("express");
const app = express();

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var cors = require('cors');
var nodemailer = require("nodemailer");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(80, () => {
    console.log("El servidor está inicializado en el puerto 80");
});

app.post('/mail_jardin', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');
	if(req.body.code == "k8Dqa2C9lKgxT6kpNs1z6RgKb0r3WaCvN6RjK7rU"){

		var correo = '';
		var asunto = '';
		var aux_theme = '';
		if(req.body.tipo == 1){
			correo = req.body.correo;
			asunto = 'Va a tu casa '+req.body.libro;
			aux_theme = jardin_theme;
			aux_theme = aux_theme.replace(/#NOMBRE#/g, req.body.nombre);
			aux_theme = aux_theme.replace(/#LIBRO#/g, req.body.libro);
		}
		if(req.body.tipo == 2){
			correo = req.body.correo;
			asunto = 'Cuento sin devolver';
			aux_theme = jardin_atraso_theme;
			aux_theme = aux_theme.replace(/#NOMBRE#/g, req.body.nombre);
			aux_theme = aux_theme.replace(/#LIBRO#/g, req.body.libro);
			aux_theme = aux_theme.replace(/#FECHA#/g, req.body.fecha);
		}
		if(req.body.tipo == 3){
			correo = 'valle-encantado@hotmail.com';
			asunto = 'Contacto Sitio Web';
			aux_theme = "Nombre: "+req.body.nombre+"<br/>Correo: "+req.body.correo+"<br/>Telefono: "+req.body.telefono+"<br/>Mensaje: "+req.body.mensaje;
		}
		if(req.body.tipo == 4){
			correo = req.body.correo;
			asunto = 'No va cuento :(';
			aux_theme = jardin_sin_bolsa_theme;
			aux_theme = aux_theme.replace(/#NOMBRE#/g, req.body.nombre);
		}
		var mailOptions = {
			from: 'bibliotecavalleencantado@gmail.com',
			to: correo,
			subject: asunto,
			html: aux_theme,
			replyTo: 'valle-encantado@hotmail.com'
        };
		var transporter = nodemailer.createTransport('smtps://bibliotecavalleencantado@gmail.com:ve7589500ve@smtp.gmail.com');
		transporter.sendMail(mailOptions, function(err, info){
			if(!err){
				fecha_correos.push(new Date().getTime());
				console.log("ENVIADO");
				res.end(JSON.stringify({ op: 1 }));
			}else{
				console.log("ERROR");
				res.end(JSON.stringify({ err: err, info: info }));
			}
		});
	}

});