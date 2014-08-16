(function() {
    'use strict';

    var canvas = document.getElementById('logo');
    var bgCanvas = document.getElementById('logo-bg');
    var dragger = document.getElementById('dragger');
    var bgCtx = bgCanvas.getContext('2d');
    var ctx = canvas.getContext('2d');
    var dragCtx = dragger.getContext('2d');

    var text = 'medmereJavaScript!'.split('');
    var initialYs = [
        26, 122, 199, 
        344, 441, 505, 570,
        685, 775, 855, 934, 
        1027, 1108, 1172, 1227, 1290, 1352, 1396
    ];

    var styleCtx = function(ctx, bg) {
        ctx.font = '170px Lobster';
        ctx.rotate(-0.2);
        ctx.textAlign = 'center';
        ctx.fillStyle = bg ? 'white' : 'gold';
        if (bg) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 17;
        }
    };

    function dragstartHandler(e) {
        var x = 1500/canvas.clientWidth*Math.max(0, Math.min(e.x - canvas.offsetLeft - 1, 1500));
        var y = 500/canvas.clientHeight*Math.max(0, Math.min(e.y - canvas.offsetTop - 1, 500));
        var pix = bgCtx.getImageData(x, y, 2, 2).data;
        var hit = 0;
        for (var i = 0; i < pix.length; i+= 4) {
            if (pix[i] > 0 || pix[i+1] > 0 || pix[i+2] > 0 || pix[i+3] > 0) {
                hit++;
            }
        }
        if (hit > 2) {
            // detect what letter was hit
            console.log('hitting');
        }
    }

    function dragendHandler(e) {

        console.log('dragHandler', arguments);
    }

    function start(data) {
        styleCtx(bgCtx, true);
        styleCtx(ctx);
        styleCtx(dragCtx);
        dragger.fillStyle = 'red';
        for (var i = 0; i < data.length; i++) {
            bgCtx.strokeText(data[i].c, data[i].y, data[i].x);
            ctx.fillText(data[i].c, data[i].y, data[i].x);
        }
        dragger.addEventListener('mouseup', dragendHandler);
        dragger.addEventListener('mousemove', dragstartHandler);
    }

    document.documentElement.addEventListener('font-loaded', function() {
        var loadSocket = new WebSocket('ws://localhost:8080/load');
        loadSocket.onmessage = function(e) {
            var data = JSON.parse(e.data);
            start(data);
        };
    });
})();