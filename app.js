// https://gist.github.com/rpflorence/701407
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.env.PORT || 3000,

    prefix = '/www';

var wsPort = 8080;
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: wsPort});
 
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
    console.log('/load');
  }
});