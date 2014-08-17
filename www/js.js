(function() {
    'use strict';

    // strive to smoothen out loading issues when major features are in place
    console.time('main');
    console.time('font-loaded');
    console.time('json-parsed');

    var height = 500;
    var width = 1500;
    var canvas = document.getElementById('logo');
    var dragger = document.getElementById('dragger');
    var hover = document.getElementById('hover');

    var ctx = canvas.getContext('2d');
    var dragCtx = dragger.getContext('2d');
    var hoverCtx =  hover.getContext('2d');

    var clientId = null;
    var text = null; // contains char data and x/y
    var hoverData = null;
    var dragging = false;
    var hoverIdx = -1;
    var dragX = -1;
    var dragY = -1;

    function extent(ctx) {
        var pix = ctx.getImageData(0, 0, width, height).data;
        for (var i = 0; i < pix.length; i+= 4) {
            if (pix[i] > 0 || pix[i+1] > 0 || pix[i+2] > 0 || pix[i+3] > 0) {
                hit++;
            }
        }

        return {top: 0, bottom: 0, left: 0, right: 0};
    }

    function detect(x, y) {
        var match = -1;
        text.forEach(function(letter, idx) {
            var hit = 0;
            var pix = letter.ctx.getImageData(x, y, 2, 2).data;

            for (var i = 0; i < pix.length; i+= 4) {
                if (pix[i] > 0 || pix[i+1] > 0 || pix[i+2] > 0 || pix[i+3] > 0) {
                    hit++;
                }
            }
            if (hit > 2) {
                match = idx;
            }
        })
        return match;
    }

    function clearCtx(ctx) {
        ctx.clearRect(-300, 0, width*2, height*2);
    }

    function render(exclude) {
        clearCtx(ctx);
        text.forEach(function(elm, i) {
            if (exclude === i) return;
            ctx.drawImage(elm.img, elm.y2, elm.x2);
        });

    }

    function hoverHandler(e) {
        if (dragging) return;
        var x = width/canvas.clientWidth*Math.max(0, Math.min(e.x - canvas.offsetLeft - 1, width));
        var y = height/canvas.clientHeight*Math.max(0, Math.min(e.y - canvas.offsetTop - 1, height));
        var idx = detect(x, y);
        hoverIdx = idx;
        clearCtx(hoverCtx);
        if (idx > -1) {
            hoverCtx.drawImage(text[idx].imgBg, text[idx].y2, text[idx].x2);
        }
    }    

    function dragstartHandler(e) {
        if (hoverIdx < 0) return;
        hoverData = text.splice(hoverIdx, 1)[0];
        dragging = true;
        dragX = e.x;
        dragY = e.y;
        render();
        clearCtx(dragCtx);
        clearCtx(hoverCtx);
        dragCtx.drawImage(hoverData.imgBg, hoverData.y2, hoverData.x2);
    }

    function dragendHandler(e) {
        dragging = false;
        dragger.style.right = 0;
        dragger.style.bottom = 0;
        hoverData.y2 += width/canvas.clientWidth*(e.x - dragX);
        hoverData.x2 += height/canvas.clientHeight*(e.y - dragY);
        clearCtx(dragCtx);
        clearCtx(hoverCtx);
        clearCtx(hoverData.ctx);
        hoverData.ctx.drawImage(hoverData.img, hoverData.y2, hoverData.x2); 
        text.push(hoverData); // moves letter to top of stack
        hoverData = null;
        render();
        hoverHandler(e); // might redraw hover shadow
    }

    function dragHandler(e) {
        if (!dragging) return;
        var x = e.x - dragX;
        var y = e.y - dragY;

        console.log('x/y',x,y);
        dragger.style.bottom = -1*y+'px';
        dragger.style.right = -1*x+'px';
        chatSocket.send(JSON.stringify({cmd: 'move', letter: hoverIdx, bottom: -1*y+'px', right: -1*x+'px'}))
    }    

    function moveHandler(data) {

    }

    function chatHandler(e) {
        var data = JSON.parse(e.data);
        console.timeEnd('json-parsed');
        if (data.cmd === 'load') {
            init(data);
        } else if (data.cmd === 'move') {
            console.log('moveHandler', data);
        }
    }

    function init(data) {
        clientId = data.clientId;
        text = data.text;
        console.log('clientId', clientId);
        var container = document.querySelector('.logo-boxx');
        text.forEach(function(letter, i) {
            // create individual letters
            var elm = document.createElement('canvas');
            elm.width = width;
            elm.height = height;
            var ctx = elm.getContext('2d');
            ctx.font = '170px Lobster';
            ctx.rotate(-0.2);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'gold';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 17;
            ctx.strokeText(letter.c, letter.y, letter.x);
            ctx.fillText(letter.c, letter.y, letter.x);
            var img = new Image();
            img.onload = function() { 
                letter.img = this;
                // create bg
                clearCtx(ctx);
                ctx.strokeStyle = 'orangered';
                ctx.lineWidth = 22;
                ctx.strokeText(letter.c, letter.y, letter.x);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 17;
                ctx.strokeText(letter.c, letter.y, letter.x);
                ctx.fillText(letter.c, letter.y, letter.x);
                var img2 = new Image();
                img2.onload = function() { 
                    ctx.rotate(0.2);
                    letter.imgBg = this; 
                };
                img2.src = elm.toDataURL();
            };
            img.src = elm.toDataURL();
            letter.ctx = ctx;
        });
        // allow some time to render all letters
        setTimeout(function() {
            render()
            document.documentElement.addEventListener('mousemove', hoverHandler);
            document.documentElement.addEventListener('mousemove', dragHandler);
            document.documentElement.addEventListener('mouseup', dragendHandler);
            dragger.addEventListener('mousedown', dragstartHandler);
            console.timeEnd('main');
        }, 100);
    }

    var fontLoaded = false;
    document.documentElement.addEventListener('font-loaded', function() {
        fontLoaded = true;
        console.timeEnd('font-loaded');
    });

    var chatSocket = new WebSocket('ws://localhost:8080/chat');
    chatSocket.onmessage = chatHandler;
})();