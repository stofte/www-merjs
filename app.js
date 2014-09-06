var http = require('http');
var WebSocketServer = require('ws').Server;
var original =require('./positions').data;
var positions = JSON.parse(JSON.stringify(original));

// seems hardwired in eb container, messing with nginx doesnt help either
var port = process.env.AWS_EC2 ? 8081 : 81;
var resetPassword = process.env.APP_RESET_PASSWORD;
console.log('port', port);
var wss = new WebSocketServer({port: port});
var sockets = [];

function pushUpdate(cmd, index) {
    var data = { cmd: cmd };
    if (index) {
        data.item = positions[index];
        data.index = index;
    } else {
        data.positions = positions;
    }
    var json = JSON.stringify(data);
    sockets.forEach(function(socket) {
        // TODO test for socket state
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
        var index = null; // if we manipulate data, all clients gets notified 
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
            
        } else if (data.cmd === 'drop') {
            positions.forEach(function(letter, idx) {
                if (letter.id === msg.letterId && letter.grabbedBy === msg.clientId) {
                    console.log('drop by', msg.clientId);
                    letter.grabbed = false;
                    letter.grabbedBy = undefined;
                    index = idx;
                } // else client attempted to drop something it wasnt holding
            });
        } else if (data.cmd === 'reset' && data.password === resetPassword) {
            positions = JSON.parse(JSON.stringify(original));
            index === -1;
            console.log('was reset', positions);
        }

        if (index === -1) {
            console.log('ws.handler:response 1', index);
            pushUpdate(data.cmd);
        } else if (index !== null && index >= 0) {
            console.log('ws.handler:response 2', index);
            pushUpdate(data.cmd, index);
        } else if (response != null) {
            console.log('ws.handler:response 3');
            response.cmd = data.cmd;
            var json = JSON.stringify(response);
            websocket.send(json);
        }
    });
  }
});