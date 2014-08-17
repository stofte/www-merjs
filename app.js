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

var textData = [
  {x: 460, y: 26, c: 'm',   x2: 0, y2: 0},
  {x: 460, y: 122, c: 'e',  x2: 0, y2: 0},
  {x: 460, y: 199, c: 'd',  x2: 0, y2: 0},

  {x: 460, y: 344, c: 'm',  x2: 0, y2: 0},
  {x: 460, y: 441, c: 'e',  x2: 0, y2: 0},
  {x: 460, y: 505, c: 'r',  x2: 0, y2: 0},
  {x: 460, y: 570, c: 'e',  x2: 0, y2: 0},

  {x: 460, y: 685, c: 'J',  x2: 0, y2: 0},
  {x: 460, y: 775, c: 'a',  x2: 0, y2: 0},
  {x: 460, y: 855, c: 'v',  x2: 0, y2: 0},
  {x: 460, y: 934, c: 'a',  x2: 0, y2: 0},
  {x: 460, y: 1027, c: 'S', x2: 0, y2: 0},
  {x: 460, y: 1108, c: 'c', x2: 0, y2: 0},
  {x: 460, y: 1172, c: 'r', x2: 0, y2: 0},
  {x: 460, y: 1227, c: 'i', x2: 0, y2: 0},
  {x: 460, y: 1290, c: 'p', x2: 0, y2: 0},
  {x: 460, y: 1352, c: 't', x2: 0, y2: 0},
  {x: 460, y: 1396, c: '!', x2: 0, y2: 0}
];
 
http.createServer(function(request, response) {
 
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd() + prefix, uri);

  if (uri === '/data.js') {
    response.writeHead(200, {"Content-Type": "text/javascript"});
    response.write('var data = ' + JSON.stringify(textData) + ';');
    response.end();    
    return;
  }

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


var clients = [];
var clientId = 0;
wss.on('connection', function(websocket) {
  websocket.clientId = clientId++;
  clients.push(websocket);
  console.log('websocket request on:', websocket.upgradeReq.url);
  if (websocket.upgradeReq.url === '/chat') {
    console.log(JSON.stringify({data: textData, clientId: websocket.clientId}));
    websocket.send(JSON.stringify({cmd: 'load', text: textData, clientId: websocket.clientId}));
    websocket.on('message', function(msg) {
      var data = JSON.parse(msg);
      if (data.cmd === 'move') {
        console.log('move cmd received on socket#', websocket.clientId);
        clients.forEach(function(socket) {
          if (socket.clientId !== websocket.clientId && socket.readyState === 1) { // 1 = OPEN
            console.log('sending move to other client#', socket.clientId);
            socket.send(msg);
          }
        });
      }
    });
  }
});