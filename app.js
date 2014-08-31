var http = require('http');
var simpleHttp = require('./simple-http');
var WebSocketServer = require('ws').Server;
var positions = require('./positions').data;

// seems hardwired in eb container, messing with nginx doesnt help either
var port = 8081;

// when running locally, we start a basic http server in place of nginx.
if (!process.env.AWS_EC2) {
    simpleHttp.start(80);
    port = 81;
}
// simple-http doesn't handle websockets, so we switch port, also in client.
var wss = new WebSocketServer({port: port});
var sockets = [];

function pushUpdate(cmd, index) {
    var data = { item: positions[index], index: index, cmd: cmd };
    var json = JSON.stringify(data);
    sockets.forEach(function(socket) {
        try {
            socket.send(json);
        } catch (e) {
            console.log('error on socket.send', e);
        }
    });
}

wss.on('connection', function(websocket) {
  if (websocket.upgradeReq.url === '/ws/') {
    sockets.push(websocket);
    websocket.on('message', function(json) {        
        var data = JSON.parse(json);
        var msg = data.data;
        var index = -1; // if we manipulate data, all clients gets notified 
        var response = null; // single client response

        if (data.cmd === 'connect') {
            console.log('connection', msg.clientId);
            response = { clientId: msg.clientId, positions: positions };
        } else if (data.cmd === 'grab') {
            positions.forEach(function(letter, idx) {
                if (letter.id === msg.letterId && !letter.grabbed) {
                    console.log('grabbed by', msg.clientId);
                    letter.grabbed = true;
                    letter.grabbedBy = msg.clientId;
                    index = idx;
                }
            });
            // client must do the same thing
            positions.push(positions.splice(index, 1)[0]); 
        } else if (data.cmd === 'drag') {
            data.cmd = 'update'; // drag is an update, since all clients renders
            positions.forEach(function(letter, idx) {
                if (letter.grabbed && letter.grabbedBy === msg.clientId) {
                    console.log('drag by', msg.clientId, msg.x2, msg.y2);
                    letter.x2 = msg.x2;
                    letter.y2 = msg.y2;
                    index = idx;
                }
            });            
        }

        // we response either way
        if (index > -1) {
            pushUpdate(data.cmd, index);
        } else if (response != null) {
            response.cmd = data.cmd;
            var json = JSON.stringify(response);
            websocket.send(json);
        }
    });
  }
});




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