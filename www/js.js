(function() {
    'use strict';

    var socket = new WebSocket('ws://localhost:8080/save');

    var canvas = document.getElementById('logo');
    var start = function() {
        var ctx = canvas.getContext('2d');
        var rot = 0.2;
        var left = 690;
        var top = 450;
        var txt = 'med mere JavaScript!';
        ctx.rotate(-rot);
        ctx.textAlign = 'center';
        ctx.font = '170px Lobster';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 17;        
        ctx.fillText(txt, left, top);
        ctx.strokeText(txt, left, top);
        var stroke = canvas.toDataURL();
        var loader = new Image();
        loader.onload = function() {
            ctx.rotate(rot);
            ctx.clearRect(0, 0, 1500, 500);
            ctx.drawImage(this, 0, 0, 1500, 500);
            ctx.rotate(-rot);
            ctx.fillStyle = 'gold';
            ctx.fillText(txt, left, top);
        };
        loader.src = stroke;
    };
    document.documentElement.addEventListener('font-loaded', start);
})();