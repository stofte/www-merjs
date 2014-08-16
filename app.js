// https://gist.github.com/rpflorence/701407
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.env.PORT || 80,
    prefix = '/www';

var wsPort = 8080;
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: wsPort});

var id = 0;
var textData = [
  {x: 460, y: 26, c: 'm', id: id++ },
  {x: 460, y: 122, c: 'e', id: id++ },
  {x: 460, y: 199, c: 'd', id: id++ },

  {x: 460, y: 344, c: 'm', id: id++ },
  {x: 460, y: 441, c: 'e', id: id++ },
  {x: 460, y: 505, c: 'r', id: id++ },
  {x: 460, y: 570, c: 'e', id: id++ },

  {x: 460, y: 685, c: 'J', id: id++ },
  {x: 460, y: 775, c: 'a', id: id++ },
  {x: 460, y: 855, c: 'v', id: id++ },
  {x: 460, y: 934, c: 'a', id: id++ },
  {x: 460, y: 1027, c: 'S', id: id++ },
  {x: 460, y: 1108, c: 'c', id: id++ },
  {x: 460, y: 1172, c: 'r', id: id++ },
  {x: 460, y: 1227, c: 'i', id: id++ },
  {x: 460, y: 1290, c: 'p', id: id++ },
  {x: 460, y: 1352, c: 't', id: id++ },
  {x: 460, y: 1396, c: '!', id: id++ }
];
 
http.createServer(function(request, response) {
 
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd() + prefix, uri);
 
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
 
      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));


wss.on('connection', function(websocket) {
  console.log('websocket request on:', websocket.upgradeReq.url);
  if (websocket.upgradeReq.url === '/load') {
    var data = JSON.stringify(textData);
    websocket.send(data);
  }
});