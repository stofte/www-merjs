var http = require('http');
var simpleHttp = require('./simple-http');
var WebSocketServer = require('ws').Server;
var textData = require('./data').data;

// seems hardwired in eb container, messing with nginx doesnt help either
var port = 8081;
// when running locally, we start a basic http server in place of nginx.
if (!process.env.AWS_EC2) {
    simpleHttp.start(port);
}
// simple-http doesn't handle websockets, so we switch port, also in client.
var wsport = process.env.AWS_EC2 ? port : port + 1;
var wss = new WebSocketServer({port: wsport});

wss.on('connection', function(websocket) {
  console.log('websocket request on:', websocket.upgradeReq.url);
  if (websocket.upgradeReq.url === '/save' || 
      websocket.upgradeReq.url === '/ws/save') {
    websocket.on('message', function(message) {
      websocket.send('echo' + message);
    });
  }
});

// function pushUpdate(cmd, index) {
//   var data = { item: textData[index], index: index, cmd: cmd };
//   if (cmd === 'grab') { 
//     textData.push(textData.splice(index, 1)[0]); // client must do the same thing
//   }
//   fayeServer.getClient().publish('/data/update', data);    
// }



// faye module piggybacks on the normal httpServer
// var wsHttpServer = http.createServer();
// var fayeServer = new faye.NodeAdapter({mount: '/ws'});
// fayeServer.attach(simpleHttp.httpServer);
// wsHttpServer.listen(80);
// simpleHttp.start(port); // launches the port 80 server

// var wsClient = new faye.Client('http://127.0.0.1:80/ws');

// wsClient.subscribe('/cmd/connect', function(msg) {
//   var data = {clientId: msg.clientId, textData: textData };
//   fayeServer.getClient().publish('/data/connect', data);
// });

// wsClient.subscribe('/cmd/grab', function(msg) {
//   var index = -1;
//   textData.forEach(function(letter, idx) {
//     if (letter.id === msg.letterId && !letter.grabbed) {
//       console.log('grabbed by', msg.clientId);
//       letter.grabbed = true;
//       letter.grabbedBy = msg.clientId;
//       index = idx;
//     }
//   });
//   if (index > -1) {
//     pushUpdate('grab', index);
//   }
// });

// wsClient.subscribe('/cmd/drag', function(msg) {
//   var index = -1;
//   textData.forEach(function(letter, idx) {
//     if (letter.grabbed && letter.grabbedBy === msg.clientId) {
//       console.log('drag by', msg.clientId);
//       letter.x2 = msg.x2;
//       letter.y2 = msg.y2;
//       index = idx;
//     }
//   });
//   if (index > -1) {
//     pushUpdate('drag', index);
//   }
// });

// wsClient.subscribe('/cmd/drop', function(msg) {
//   var index = -1;
//   textData.forEach(function(letter, idx) {
//     if (letter.id === msg.letterId && letter.grabbedBy === msg.clientId) {
//       console.log('drop by', msg.clientId);
//       letter.grabbed = false;
//       letter.grabbedBy = undefined;
//       index = idx;
//     } // else client attempted to drop something it wasnt holding
//   });
//   if (index > -1) {
//     pushUpdate('drop', index);
//   }
// });