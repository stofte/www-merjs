(function() {
    'use strict';
    var elm = document.createElement('div');
    elm.appendChild(document.createTextNode('somereallylongstringthatshouldchangesizewhenfontloads'));
    elm.style.position = 'absolute';
    elm.style.top = '-9999px';
    elm.style.left = '-9999px';
    elm.style.fontSize = '300%';
    document.documentElement.appendChild(elm);
    var initialW = elm.offsetWidth;
    elm.style.fontFamily = 'Lobster';
    var timer = setInterval(function() {
        if (initialW !== elm.offsetWidth) {
            clearInterval(timer);
            console.log('firing event');
            document.documentElement.dispatchEvent(new Event('font-loaded'));
        }
    });
})();