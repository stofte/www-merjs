(function() {
    'use strict';

    function ts() {
        return (new Date()).getTime();
    }

    var height = 500;
    var width = 1500;
    var logoBox = document.querySelector('.logo-box');
    var canvas = document.getElementById('logo');
    var hover = document.getElementById('hover');
    var grabbed = document.getElementById('grabbed');

    var ctx = canvas.getContext('2d');
    var hoverCtx =  hover.getContext('2d');
    var grabCtx = grabbed.getContext('2d');
    // var othersCtx = others.getContext('2d');

    // copy of the textData structure received from the server
    var textData = null;
    // contains ctx for hit detection. updated client side when the corrosponding
    // element in text array is updated. { id: { ctx: ctx, img: img, imgBg: imgBg } }
    var graphics = {};
    var focusItem = null; // text item being hovered/dragged locally
    
    // dragging state
    var dragging = false;
    var dragAssumption = false; // true if we've assumed grab of focusItem only
    var dragX = -1;
    var dragY = -1;

    console.time('socket');    
    var wsClient = createMsgClient();
    window.client = wsClient;
    var clientId = guid(); // todo need a better way to generate id


    function boundingBox(data) {
        // O(n) rough approx
        var i = 0;
        var top = -1;
        var bottom = -1;
        var left = -1;
        var right = -1;
        var tmp = -1;
        var step = 7;
        
        while (i < data.length) {
            if (data[i] != 0 || data[i+1] != 0 || data[i+2] != 0 || data[i+3] != 0) {
                var x = (i/4)%width;
                var y = Math.floor((i/4)/width);
                if (top === -1) {
                    top = y;
                } else {
                    bottom = y;
                }
                // updates sides
                if (x < left || left === -1) left = x;
                if (x > right || right === -1) right = x;
            }
            i += 4*step;
        }

        return {
            top: top, 
            right: right, 
            bottom: bottom, 
            left: left  
        };
    }


    var maxLetterIdGenerated = -1;
    function generateLetter(letter) {
        graphics[letter.id] = {};
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
        var bb = boundingBox(ctx.getImageData(0, 0, width, height).data);
        var img = new Image();
        img.onload = function() { 
            graphics[letter.id].img = this;
            // create bg
            clearCtx(ctx);
            ctx.strokeStyle = 'orangered';
            ctx.lineWidth = 40;
            ctx.strokeText(letter.c, letter.y, letter.x);
            // only blur the biggest stroke effect
            stackBlurCanvasRGBA(elm, 0, 0, width, height, 15);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 23;
            ctx.strokeText(letter.c, letter.y, letter.x);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 17;
            ctx.strokeText(letter.c, letter.y, letter.x);
            ctx.fillText(letter.c, letter.y, letter.x);
            var img2 = new Image();
            img2.onload = function() { 
                // resets rotation as from this point we will just be using
                // the images and background images.
                ctx.rotate(0.2);
                graphics[letter.id].imgBg = this;
                // save the offset we render at, so we know when the server updates
                graphics[letter.id].x2 = letter.x2;
                graphics[letter.id].y2 = letter.y2;
                clearCtx(ctx);
                ctx.drawImage(graphics[letter.id].img, letter.y2, letter.x2);
                // drawImage is synchronous, so at this point, all processing 
                // for the given letter is finished.
                if (maxLetterIdGenerated < letter.id) {
                    maxLetterIdGenerated = letter.id;
                }
            };
            img2.src = elm.toDataURL();
        };
        img.src = elm.toDataURL();
        graphics[letter.id].ctx = ctx;
        graphics[letter.id].boundingBox = bb; 
    }

    function fixLetterGraphics(letter) {
        // redraws the context for the letter to the matching x2/y2s
        var g = graphics[letter.id];
        if (g.x2 != letter.x2 || g.y2 != letter.y2) {
            clearCtx(g.ctx);
            g.ctx.drawImage(g.img, letter.y2, letter.x2);
            g.x2 = letter.x2;
            g.y2 = letter.y2;
        }
    }

    function clearCtx(ctx) {
        ctx.clearRect(-300, 0, width*2, height*2);
    }

    function render() {
        clearCtx(ctx);
        clearCtx(grabCtx);
        textData.forEach(function(letter, i) {
            if (!letter.grabbed) {
                ctx.drawImage(graphics[letter.id].img, letter.y2, letter.x2);
            } else {
                grabCtx.drawImage(graphics[letter.id].img, letter.y2, letter.x2);
            }
        });
    }

    // returns the hovered letter from textData
    function detect(x, y) {
        var match = null;
        textData.forEach(function(letter, idx) {
            var hit = 0;
            var pix = graphics[letter.id].ctx.getImageData(x, y, 2, 2).data;

            for (var i = 0; i < pix.length; i+= 4) {
                if (pix[i] > 0 || pix[i+1] > 0 || pix[i+2] > 0 || pix[i+3] > 0) {
                    hit++;
                }
            }
            if (hit > 2) {
                match = letter;
            }
        })
        return match;
    }

    function hoverHandler(e) {
        if (dragging || dragAssumption) return;
        var x = width/canvas.clientWidth*Math.max(0, Math.min(e.x - canvas.offsetLeft, width));
        var y = height/canvas.clientHeight*Math.max(0, Math.min(e.y - logoBox.offsetTop - canvas.offsetTop, height));
        focusItem = detect(x, y);
        clearCtx(hoverCtx);
        if (focusItem !== null) {
            hoverCtx.drawImage(graphics[focusItem.id].imgBg, focusItem.y2, focusItem.x2);
        }
    }

    function dragstartHandler(e) {
        if (focusItem === null) return;
        dragX = e.x;
        dragY = e.y;
        var data = {
            letterId: focusItem.id, 
            clientId: clientId,            
        };
        dragAssumption = true;
        wsClient.publish('grab', data);
    }

    function dragHandler(e) {
        if (!dragging && !dragAssumption) return;
        // the other layer renders via normal offsetting
        var y2 = focusItem.y2 + width/canvas.clientWidth * (e.x - dragX);
        var x2 = focusItem.x2 + height/canvas.clientHeight * (e.y - dragY);
        var data = {
            clientId: clientId,
            x2: x2,
            y2: y2
        };

        // hoverCtx.drawImage(graphics[focusItem.id].imgBg, y2, x2);
        // these might be unwarrented if we didn't grab the letter, 
        // in which case the server just ignores them
        wsClient.publish('drag', data);
    }

    function dragendHandler(e) {
        if (!dragging && !dragAssumption) return;
        var data = { 
            letterId: focusItem.id, 
            clientId: clientId,
            y2: focusItem.y2 + width/canvas.clientWidth * (e.x - dragX),
            x2: focusItem.x2 + height/canvas.clientHeight * (e.y - dragY)
        };
        wsClient.publish('drop', data);
        dragging = false;
        dragAssumption = false;
    }

    // todo ensure font is loaded in connect subscriber
    var fontLoaded = false;
    document.documentElement.addEventListener('font-loaded', function() {
        fontLoaded = true;
        console.timeEnd('font-loaded');
    });

    // when someone grabs a letter it moves to the top of the render order
    wsClient.subscribe('grab', function(msg) {
        textData[msg.index] = msg.item;
        textData.push(textData.splice(msg.index, 1)[0]);
        render();
    });

    // when the letter is dropped we recompute the hitbox grpahics
    wsClient.subscribe('drop', function(msg) {
        textData[msg.index] = msg.item;
        textData.forEach(fixLetterGraphics);
        render();
    });

    // item updated (moved)
    wsClient.subscribe('update', function(msg) {
        textData[msg.index] = msg.item;
        render();
    });

    wsClient.subscribe('reset', function(msg) {
        textData = msg.data;
        render();
    });

    // initial connection loads all letter positions
    wsClient.subscribe('connect', function connectHandler(msg) {
        console.log('connect:msg', msg);
        var fontTimestamp = ts();
        var fontDelta = ts() - fontTimestamp;
        var fontPoller = function() {
            fontDelta = ts() - fontTimestamp;
            console.log('fontPoller:delta', fontDelta, fontLoaded, fontTimestamp);
            if (fontLoaded && msg.clientId === clientId) {
                // get the max letter id
                var maxId = -1;
                var renderTimestamp = ts();
                var renderDelta = ts() - renderTimestamp;
                textData = msg.positions;
                textData.forEach(function(l) { maxId = l.id > maxId ? l.id : maxId; });
                textData.forEach(generateLetter);
                // polling until letters are generated (the onload stuff causes it to become async)
                var renderPoller = function (){
                    renderDelta = ts() - renderTimestamp;
                    console.log('renderPoller:delta', renderDelta, renderTimestamp);
                    if (maxLetterIdGenerated === maxId) {
                        render();
                        document.documentElement.addEventListener('mousemove', hoverHandler);
                        document.documentElement.addEventListener('mousemove', dragHandler);
                        document.documentElement.addEventListener('mousedown', dragstartHandler);
                        document.documentElement.addEventListener('mouseup', dragendHandler);
                        console.timeEnd('startup'); // total load/rendering time
                    } else if (renderDelta < 30000) { // poll for 30 secs, since this can be compute heavy
                        setTimeout(renderPoller, 100);
                    } else {
                        console.error('letter generation timed out', renderDelta);
                    }
                }
                setTimeout(renderPoller);
            } else if (fontDelta < 30000) {
                setTimeout(fontPoller, 100);
            } else {
                console.error('waiting for font timed out', fontDelta);
            }
        };
        setTimeout(fontPoller);
    });

    // polls the socket, waiting for when it opens.
    var socketTimestamp = ts();
    var socketDelta = ts() - socketTimestamp;
    
    setTimeout(function socketPoller() {
        socketDelta = ts() - socketTimestamp;
        console.log('socketPoller:delta', socketDelta, socketTimestamp);
        if (wsClient.socket.readyState === 1) {
            console.timeEnd('socket');
            wsClient.publish('connect', { clientId: clientId });
        } else if (socketDelta < 10000) { // poll for x milliseconds
            setTimeout(socketPoller, 10);
        } else {
            console.error('socket could not connect', socketDelta);
        }
    });

})();