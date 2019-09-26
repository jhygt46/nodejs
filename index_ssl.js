var fs = require("fs");

var opt = {
	key: fs.readFileSync("cert/izusushi.cl.key"),
	cert: fs.readFileSync("cert/izusushi.cl.crt"),
	ca: fs.readFileSync("cert/izusushi.cl.ca-bundle")
}

var app = require('express')();
var http = require('https').Server(opt, app);

var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var cors = require('cors');
var request = require('request');

var pedido_theme = fs.readFileSync("mail_template/pedido.html", { encoding: 'utf8' });
var inicio_theme = fs.readFileSync("mail_template/base.html", { encoding: 'utf8' });
var recuperar_theme = fs.readFileSync("mail_template/recuperar.html", { encoding: 'utf8' });
var reserva_theme = fs.readFileSync("mail_template/reserva.html", { encoding: 'utf8' });

var nodemailer = require("nodemailer");
var fecha_correos = new Array();

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var ses = new AWS.SES({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
            	"ses:SendEmail",
            	"ses:SendRawEmail"
            ],
            "Resource": "arn:aws:iam::406019176861:user/ses-smtp-user.20190116-210346"
        }
    ]
});
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
var motos = [];
var url = "https://misitiodelivery.cl/ajax/index.php";
var param_llamado = { accion: 'get_motos' };

request.post({
	url: url,
	form: param_llamado
}, function(error, response, body){
	var aux_motos = JSON.parse(body);
	motos = aux_motos.motos;
});
*/

app.get('/', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'text/plain');
	res.end('');
});
app.post('/cambiar_posicion', urlencodedParser, function(req, res){
	for(var i=0, ilen=motos.length; i<ilen; i++){
		if(motos[i].code == req.query.uid && motos[i].id_mot == req.query.id){
			for(var j=0, jlen=motos[i].pedidos.length; j<jlen; j++){
				/* var nDate = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }); */
				var time = new Date().getTime() - motos[i].pedidos[j].fecha;
				if(time < 5400000){
					var aux = { accion: 2, lat: req.query.lat, lng: req.query.lng };
					io.emit('pedido-'+motos[i].pedidos[j].code, { estado: JSON.stringify(aux) });
				}else{
					if(motos[i].pedidos.splice(j, 1)){
						j--;
						jlen--;
					}
				}
			}
			for(var m=0, mlen=motos[i].locales.length; m<mlen; m++){
				var aux2 = { id_mot: motos[i].id_mot, lat: req.query.lat, lng: req.query.lng };
				io.emit('map-'+motos[i].locales[m], { info: JSON.stringify(aux2) });
			}
		}
	}
});
function is_moto(id_mot){
	var res = -1;
	for(var i=0, ilen=motos.length; i<ilen; i++){
		if(motos[i].id_mot == id_mot){
			res = i;
		}
	}
	return res;
}
app.post('/agregar_moto', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
	var id_mot = req.body.id_mot;
	var param_llamado = { accion: 'get_moto', id_mot: id_mot };
	request.post({
		url: url,
		form: param_llamado
	}, function(error, response, body){
		var data = JSON.parse(body);
		if(data.op == 1){
			var aux = is_moto(id_mot);
			if(aux == -1){
				motos.push(data.moto);
			}else{
				motos[aux] = data.moto;
			}
		}
		res.end(JSON.stringify({ data: data }));
	});
});
app.post('/add_pedido_moto', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
	var id_mot = req.body.id_mot;
	var code = req.body.code;
	for(var i=0, ilen=motos.length; i<ilen; i++){
		if(motos[i].id_mot == id_mot){
			motos[i].pedidos.push({ fecha: new Date().getTime(), code: code });
		}
	}
	res.end(JSON.stringify({ op: 1 }));
});
app.post('/rm_pedido_moto', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
	var id_mot = req.body.id_mot;
	var code = req.body.code;
	for(var i=0, ilen=motos.length; i<ilen; i++){
		if(motos[i].id_mot == id_mot){
			for(var j=0, jlen=motos[i].pedidos.length; j<jlen; j++){
				if(motos[i].pedidos[j].code == code){
					motos[i].pedidos.splice(j, 1);
				}
			}
		}
	}
	res.end(JSON.stringify({ op: 1 }));
});
app.post('/mail_contacto', urlencodedParser, function(req, res){

	var mailOptions = {
		from: 'misitiodelivery@gmail.com',
		to: 'diego.gomez.bezmalinovic@gmail.com',
	  	subject: 'CONTACTO MISITIODELIVERY',
	  	body: '<b>'+req.body.nombre+' - '+req.body.telefono+' - '+req.body.email+' - '+req.body.asunto+'</b>'
	};
	enviar_sesmail(mailOptions);
	res.end();

});
app.post('/mail_recuperar', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');
	var aux_theme = inicio_theme;
	aux_theme = aux_theme.replace(/#ID#/g, req.body.id);
	aux_theme = aux_theme.replace(/#CODE#/g, req.body.code);

	var mailOptions = {
	  	from: 'misitiodelivery@gmail.com',
	  	to: req.body.correo,
	  	subject: 'Bienvenido a MiSitioDelivery.cl',
	  	html: aux_theme
	};
	var transporter = nodemailer.createTransport('smtps://misitiodelivery@gmail.com:dVGbBSxi9Hon8Bqx@smtp.gmail.com');
	transporter.sendMail(mailOptions, function(err, info){
		if(!err){
			fecha_correos.push(new Date().getTime());
			res.end(JSON.stringify({op: 1}));
		}else{
			res.end(JSON.stringify({op: 2, err: err, info: info}));
		}
	});

});
app.post('/mail_recuperar_medici', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');
	var aux_theme = recuperar_theme;
	aux_theme = aux_theme.replace(/#LINK#/g, req.body.link);

	var mailOptions = {
		from: 'misitiodelivery@gmail.com',
		to: req.body.correo,
		subject: 'Recuperar Password',
		html: aux_theme
  	};
	
	var transporter = nodemailer.createTransport('smtps://misitiodelivery@gmail.com:dVGbBSxi9Hon8Bqx@smtp.gmail.com');
	transporter.sendMail(mailOptions, function(err, info){
		if(!err){
			fecha_correos.push(new Date().getTime());
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2, err: err, info: info }));
		}
	});

});
app.post('/mail_contacto_medici', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');
	var mailOptions = {
		from: 'misitiodelivery@gmail.com',
		to: 'diego.gomez.bezmalinovic@gmail.com',
		subject: 'CONTACTO SITIO WEB',
		body: '<b>Nombre:</b> '+req.body.nombre+'<br/><b>Correo:</b>'+req.body.correo+'<br/><b>Asunto:</b> '+req.body.asunto+'<br/><b>Mensaje:</b> '+req.body.mensaje+'<br/>'
	};
	var params = { 
		Destination: { 
			ToAddresses: []
		}, 
		Message: { 
			Body: { 
				Html: { 
					Charset: 'UTF-8', Data: '' 
				} 
			}, 
			Subject: { 
				Charset: 'UTF-8', Data: '' 
			}
		}, 
		ReturnPath: 'misitiodelivery@gmail.com', 
		Source: 'misitiodelivery@gmail.com'
	};

	params.Destination.ToAddresses.push(mailOptions.to);
	params.Message.Subject.Data = mailOptions.subject;
	params.Message.Body.Html.Data = mailOptions.body;

	ses.sendEmail(params, (err, data) => { 
		if(!err){ 
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2 }));
		}
	});

});
app.post('/mail_reserva_medici', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');

	var mailOptions2 = {
		from: 'misitiodelivery@gmail.com',
		to: req.body.correo_doc,
		subject: 'NUEVA RESERVA WEB',
		body: '<b>Rut:</b> '+req.body.rut+'<br/><b>Nombre:</b>'+req.body.nombre+'<br/><b>Correo:</b>'+req.body.correo+'<br/><b>Telefono:</b>'+req.body.telefono+'<br/><b>Mensaje:</b>'+req.body.mensaje+'<br/><b>Fecha:</b>'+req.body.semana+' '+req.body.dia+' '+req.body.mes+' '+req.body.ano+' a las '+req.body.hora+'<br/>'
	};
	var params = { 
		Destination: { 
			ToAddresses: [] 
		}, 
		Message: { 
			Body: { 
				Html: { 
					Charset: 'UTF-8', Data: '' 
				} 
			}, 
			Subject: { 
				Charset: 'UTF-8', Data: '' 
			}
		}, 
		ReturnPath: 'misitiodelivery@gmail.com', 
		Source: 'misitiodelivery@gmail.com'
	};

	params.Destination.ToAddresses.push(mailOptions2.to);
	params.Message.Subject.Data = mailOptions2.subject;
	params.Message.Body.Html.Data = mailOptions2.body;

	ses.sendEmail(params, (err, data) => { 
		if(!err){
			//res.end(JSON.stringify({ op: 1 }));
		}else{
			//res.end(JSON.stringify({ op: 2 }));
		}
	});

	var aux_theme = reserva_theme;

	aux_theme = aux_theme.replace(/#ID#/g, req.body.id);
	aux_theme = aux_theme.replace(/#CODE#/g, req.body.code);
	aux_theme = aux_theme.replace(/#NOMBRE#/g, req.body.nombre);
	aux_theme = aux_theme.replace(/#HORA#/g, req.body.hora);
	aux_theme = aux_theme.replace(/#SEMANA#/g, req.body.semana);

	aux_theme = aux_theme.replace(/#DIA#/g, req.body.dia);
	aux_theme = aux_theme.replace(/#MES#/g, req.body.mes);
	aux_theme = aux_theme.replace(/#ANO#/g, req.body.ano);
	
	aux_theme = aux_theme.replace(/#PROFESIONAL#/g, req.body.profesional);
	//aux_theme = aux_theme.replace(/#ESPECIALIDAD#/g, req.body.especialidad);

	var mailOptions1 = {
		from: 'misitiodelivery@gmail.com',
		to: req.body.correo,
		subject: 'Nueva Reserva',
		html: aux_theme
	};
	var transporter = nodemailer.createTransport('smtps://misitiodelivery@gmail.com:dVGbBSxi9Hon8Bqx@smtp.gmail.com');
	transporter.sendMail(mailOptions1, function(err, info){
		if(!err){
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2 }));
		}
	});

});
app.post('/mail_inicio', urlencodedParser, function(req, res){

	var aux_theme = inicio_theme;
	aux_theme = aux_theme.replace(/#ID#/g, req.body.id);
	aux_theme = aux_theme.replace(/#CODE#/g, req.body.code);

	var mailOptions1 = {
	  	from: 'misitiodelivery@gmail.com',
	  	to: req.body.correo,
	  	subject: 'Bienvenido a MiSitioDelivery.cl',
	  	html: aux_theme
	};
	enviar_gmail(mailOptions1);

	var mailOptions2 = {
	  	from: 'misitiodelivery@gmail.com',
	  	to: 'diego.gomez.bezmalinovic@gmail.com',
	  	subject: 'NUEVO DOMINIO MISITIODELIVERY',
	  	body: '<b>NUEVO DOMINIO '+req.body.dominio+' CORREO: '+req.body.correo+'</b>'
	};
	enviar_sesmail(mailOptions2);
	res.end();

});
app.post('/enviar_chat', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
	if(req.body.accion == "enviar_mensaje_local" && req.body.hash == "hash"){
		io.emit('enviar-chat-'+req.body.local_code, { id_ped: req.body.id_ped, mensaje: req.body.mensaje });
		res.end(JSON.stringify({op: 'enviar-chat-'+req.body.local_code}));
	}
	res.end(JSON.stringify({op2: req.body}));
});
app.post('/borrar_cocina', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
	if(req.body.accion == "borrar_cocina_local" && req.body.hash == "hash"){
		io.emit('cocina-rm-'+req.body.local_code, { id_ped: req.body.id_ped });
	}
	res.end(JSON.stringify({op: 1}));
});
app.post('/enviar_cocina', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
	if(req.body.accion == "enviar_cocina_local" && req.body.hash == "hash"){
		io.emit('cocina-pos-'+req.body.local_code, { id_ped: req.body.id_ped, num_ped: req.body.num_ped, carro: req.body.carro, promos: req.body.promos});
	}
	res.end(JSON.stringify({op: 1}));
});
app.post('/enviar_local', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');
	io.emit('local-'+req.body.local_code, req.body.id_ped);
	io.emit('cocina-'+req.body.local_code, req.body.id_ped);

	if(req.body.accion == "enviar_pedido_local" && req.body.hash == "Lrk}..75sq[e)@/22jS?ZGJ<6hyjB~d4gp2>^qHm"){

		const params = { Destination: { ToAddresses: [] }, Message: { Body: { Html: { Charset: 'UTF-8', Data: '' } }, Subject: { Charset: 'UTF-8', Data: '' }}, ReturnPath: 'misitiodelivery@gmail.com', Source: 'misitiodelivery@gmail.com'};
		params.Destination.ToAddresses.push(req.body.correo);
		params.Message.Subject.Data = 'Pedido #'+req.body.num_ped;
		
		var aux_theme = pedido_theme;
		aux_theme = aux_theme.replace(/#dominio#/g, req.body.dominio);
		aux_theme = aux_theme.replace(/#pedido_code#/g, req.body.pedido_code);
		aux_theme = aux_theme.replace(/#telefono#/g, req.body.telefono);

		params.Message.Body.Html.Data = aux_theme;
		ses.sendEmail(params, (err, data) => { 
			if(!err){ 
				//console.log(data.MessageId);
				res.end(JSON.stringify({ op: 1 }));
			}else{ 
				//console.log(err);
				res.end(JSON.stringify({ op: 2 }));
			}
		});

	}else{
	
		res.end(JSON.stringify({ op: 2 }));

	}


});
app.post('/cambiar_estado', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');
	io.emit('pedido-'+req.body.pedido_code, { estado: req.body.estado });
	res.end(JSON.stringify({op: 1}));

});
function enviar_gmail(mailOptions){

	var transporter = nodemailer.createTransport('smtps://misitiodelivery@gmail.com:dVGbBSxi9Hon8Bqx@smtp.gmail.com');
	transporter.sendMail(mailOptions, function(error, info){
		if(!err){
			fecha_correos.push(new Date().getTime());
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2 }));
		}
	});

}
function enviar_sesmail(mailOptions){

	var params = { 
		Destination: { 
			ToAddresses: [] 
		}, 
		Message: { 
			Body: { 
				Html: { 
					Charset: 'UTF-8', Data: '' 
				} 
			}, 
			Subject: { 
				Charset: 'UTF-8', Data: '' 
			}
		}, 
		ReturnPath: 'misitiodelivery@gmail.com', 
		Source: 'misitiodelivery@gmail.com'
	};

	params.Destination.ToAddresses.push(mailOptions.to);
	params.Message.Subject.Data = mailOptions.subject;
	params.Message.Body.Html.Data = mailOptions.body;

	ses.sendEmail(params, (err, data) => { 
		if(err){ 
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2 }));
		}
	});

}
http.listen(443, function(){
	console.log('SERVER HTTPS/SOCKET START');
});