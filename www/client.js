(function() {
    'use strict';

    // creates a simple pub/sub interface using a basic ws socket
    window.createMsgClient = function createMsgClient() {
        var host = location.hostname;
        // when running locally we switch port for websockets
        var wshost = 'ws://' + host + (host === 'localhost' ? ':81' : '') + '/ws/';
        var subbers = {};
        var ws = new WebSocket(wshost);

        var pub = function(cmd, data) {
            var json = JSON.stringify({cmd: cmd, data: data});
            console.log('sending', cmd, data)
            ws.send(json);
        };

        var messageHandler = function(e) {
            var data = JSON.parse(e.data);
            console.log('messageHandler', data.cmd)
            if (subbers[data.cmd]) {

                subbers[data.cmd].forEach(function(elm, idx) {
                    console.log('calling handler', data.cmd)
                    elm(data);
                });
            }
        };

        var sub = function(cmd, handler) {
            if (subbers[cmd]) {
                subbers[cmd].push(handler);
            } else {
                subbers[cmd] = [handler];
            }
        };

        ws.onmessage = messageHandler;

        var obj = {
            publish: pub,
            subscribe: sub
        };

        return obj;
    };

})();