var http = require('http');
var faye = require('faye');
var simpleHttp = require('./simple-http');

var prefix = '/www';
var port = 3000; process.env.PORT || 3000;

var id = 0;
var textData = [
  {x: 460, y: 26, c: 'm',   x2: 0, y2: 0, id: id++ },
  {x: 460, y: 122, c: 'e',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 199, c: 'd',  x2: 0, y2: 0, id: id++ },

  {x: 460, y: 344, c: 'm',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 441, c: 'e',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 505, c: 'r',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 570, c: 'e',  x2: 0, y2: 0, id: id++ },

  {x: 460, y: 685, c: 'J',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 775, c: 'a',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 855, c: 'v',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 934, c: 'a',  x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1027, c: 'S', x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1108, c: 'c', x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1172, c: 'r', x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1227, c: 'i', x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1290, c: 'p', x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1352, c: 't', x2: 0, y2: 0, id: id++ },
  {x: 460, y: 1396, c: '!', x2: 0, y2: 0, id: id++ }
];
 
function pushUpdate(cmd, index) {
  var data = { item: textData[index], index: index, cmd: cmd };
  if (cmd === 'grab') { 
    textData.push(textData.splice(index, 1)[0]); // client must do the same thing
  }
  fayeServer.getClient().publish('/data/update', data);    
}



// faye module piggybacks on the normal httpServer
// var wsHttpServer = http.createServer();
var fayeServer = new faye.NodeAdapter({mount: '/ws'});
fayeServer.attach(simpleHttp.httpServer);
// wsHttpServer.listen(80);
simpleHttp.start(port); // launches the port 80 server

var wsClient = new faye.Client('http://127.0.0.1:80/ws');

wsClient.subscribe('/cmd/connect', function(msg) {
  var data = {clientId: msg.clientId, textData: textData };
  fayeServer.getClient().publish('/data/connect', data);
});

wsClient.subscribe('/cmd/grab', function(msg) {
  var index = -1;
  textData.forEach(function(letter, idx) {
    if (letter.id === msg.letterId && !letter.grabbed) {
      console.log('grabbed by', msg.clientId);
      letter.grabbed = true;
      letter.grabbedBy = msg.clientId;
      index = idx;
    }
  });
  if (index > -1) {
    pushUpdate('grab', index);
  }
});

wsClient.subscribe('/cmd/drag', function(msg) {
  var index = -1;
  textData.forEach(function(letter, idx) {
    if (letter.grabbed && letter.grabbedBy === msg.clientId) {
      console.log('drag by', msg.clientId);
      letter.x2 = msg.x2;
      letter.y2 = msg.y2;
      index = idx;
    }
  });
  if (index > -1) {
    pushUpdate('drag', index);
  }
});

wsClient.subscribe('/cmd/drop', function(msg) {
  var index = -1;
  textData.forEach(function(letter, idx) {
    if (letter.id === msg.letterId && letter.grabbedBy === msg.clientId) {
      console.log('drop by', msg.clientId);
      letter.grabbed = false;
      letter.grabbedBy = undefined;
      index = idx;
    } // else client attempted to drop something it wasnt holding
  });
  if (index > -1) {
    pushUpdate('drop', index);
  }
});