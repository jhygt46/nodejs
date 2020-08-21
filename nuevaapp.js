const express = require("express");
const app = express();
var request = require('request');
var data = [];
var categorias = [0, 1, 2, 3];


app.listen(81, () => {

    console.log("El servidor está inicializado en el puerto 81");

    categorias.forEach(function(item){
        request.post({
            url: 'http://localhost/nueva_app/services.php',
            form: { accion: 'get_data', categoria: categorias[i] }
        }, function(error, response, body){
            data[item] = JSON.parse(body);
        });
    });

    for(var i=0, ilen=categorias.length; i<ilen; i++){
        
    }
    
});

app.get('/', function(req, res){

    var re = [];
    data.forEach(function(item){
        re.push(item.opcs);
    });
    res.end(JSON.stringify(data));


    /*
    res.setHeader('Content-Type', 'text/plain');
    var cat = [1, 3, 4, 1, 7];
    var evals = { precio: 5, calidad: 10, posicion: 5, atencion: 7, rapidez: 0 };
    var opcs = { procesador: 2, pantalla: 0 };
    var items = [{ id: 1, procesador: 2, pantalla: 0 }, { id: 2, procesador: 3, pantalla: 1 }, { id: 3, procesador: 1, pantalla: 2 }];
    var re = [], aux;
    items.forEach(function(item){
        aux = true;
        for(x in opcs){
            if(aux){
                if(item[x] != opcs[x]){
                    aux = false;
                }
            }
        }
        if(aux){
            re.push(item);
        }
    });
    res.end(JSON.stringify({ re: data }));
    */
    
});