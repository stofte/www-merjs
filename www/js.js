(function() {
    'use strict';

    var height = 500;
    var width = 1500;
    var canvas = document.getElementById('logo');
    var bgCanvas = document.getElementById('logo-bg');
    var dragger = document.getElementById('dragger');
    var hover = document.getElementById('hover');

    var bgCtx = bgCanvas.getContext('2d');
    var ctx = canvas.getContext('2d');
    var dragCtx = dragger.getContext('2d');
    var hoverCtx =  hover.getContext('2d');
    var data = null; // contains char data and x/y

    var hoverIdx = -1;
    var dragging = false;
    var hoverX = -1;
    var hoverY = -1;
    var dragImg = null;

    var detect = function(x, y) {
        for (var j = 0; j < data.length; j++) {
            var hit = 0;
            var pix = data[j].canvas.getImageData(x, y, 2, 2).data;
            for (var i = 0; i < pix.length; i+= 4) {
                if (pix[i] > 0 || pix[i+1] > 0 || pix[i+2] > 0 || pix[i+3] > 0) {
                    hit++;
                }
            }
            if (hit > 2) {
                return j;
            }
        }
        return -1;
    };

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

    function hoverHandler(e) {
        if (dragging) return;
        var x = width/canvas.clientWidth*Math.max(0, Math.min(e.x - canvas.offsetLeft - 1, width));
        var y = height/canvas.clientHeight*Math.max(0, Math.min(e.y - canvas.offsetTop - 1, height));
        var idx = detect(x, y);
        dragCtx.clearRect(-300, 0, width*2, height*2);
        hoverCtx.clearRect(-300, 0, width*2, height*2);
        if (idx < 0) {
            hoverIdx = -1;
            return;
        }
        hoverIdx = idx;
        hoverCtx.strokeStyle = 'orangered';
        hoverCtx.lineWidth = 25;
        hoverCtx.strokeText(data[idx].c, data[idx].y, data[idx].x);
        hoverCtx.strokeStyle = 'white';
        hoverCtx.lineWidth = 17;
        hoverCtx.strokeText(data[idx].c, data[idx].y, data[idx].x);
        hoverCtx.fillStyle = 'gold';
        hoverCtx.fillText(data[idx].c, data[idx].y, data[idx].x);
    }

    function dragHandler(e) {
        if (!dragging) return;
        var x = e.x - hoverX;
        var y = e.y - hoverY;
        dragger.style.bottom = -1*y+'px';
        dragger.style.right = -1*x+'px';
    }

    function dragendHandler(e) {
        dragging = false;
        dragger.style.right = 0;
        dragger.style.bottom = 0;
        hoverHandler(e); // might redraw hover
    }

    function dragstartHandler(e) {
        if (hoverIdx < 0) return;
        dragging = true;
        hoverX = e.x;
        hoverY = e.y;
        var hoverData = hover.toDataURL();//.getImageData(0, 0, width, height);
        var img = new Image();
        img.onload = function() {
            hoverCtx.clearRect(-300, 0, width*2, height*2);            
            dragCtx.clearRect(-300, 0, width*2, height*2);
            dragger.style.right = 0;
            dragger.style.bottom = 0;
            dragImg = this;
            dragCtx.drawImage(this, 0, 0);
        };
        img.src = hoverData;
    }

    function start() {
        styleCtx(bgCtx, true);
        styleCtx(ctx);
        styleCtx(dragCtx);
        styleCtx(hoverCtx, true);
        dragCtx.rotate(0.2);
        for (var i = data.length-1; i > -1; i--) {
            styleCtx(data[i].canvas, true);
            data[i].canvas.lineWidth = 22;
            bgCtx.strokeText(data[i].c, data[i].y, data[i].x);
            ctx.fillText(data[i].c, data[i].y, data[i].x);
            data[i].canvas.strokeText(data[i].c, data[i].y, data[i].x);
        }
        dragger.addEventListener('mousemove', hoverHandler);
        dragger.addEventListener('mousemove', dragHandler);
        dragger.addEventListener('mousedown', dragstartHandler);
        dragger.addEventListener('mouseup', dragendHandler);
    }

    function init(e) {
        data = JSON.parse(e.data);
        for(var i = 0; i < data.length; i++) {
            // elm is used to do hit detection
            var elm = document.createElement('canvas');
            elm.width = width;
            elm.height = height;
            data[i].canvas = elm.getContext('2d');
        }
        start();
    }

    document.documentElement.addEventListener('font-loaded', function() {
        var loadSocket = new WebSocket('ws://localhost:8080/load');
        loadSocket.onmessage = init;
    });
})();