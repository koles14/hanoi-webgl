if (!window.WebGLRenderingContext)
    alert('크롬이 아니면 안 됩니다!');

function load(url, callback) {
    console.debug('load: ' + url);

    var xhr = new XMLHttpRequest;

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status >= 400) {
                throw new Error('Cannot load: ' + url);
            } else {
                callback(xhr.responseText);
            }
            xhr.onreadystatechange = null;
            xhr = null;
        }
    };

    xhr.open('GET', url, true);
    xhr.send(null);
}

var MODELTEXT = [];
var VERTEX_SHADER = '';
var FRAGMENT_SHADER = '';

function loadAll(callback) {
    var depth = 2;
    function dec() { --depth == 0 && callback() }

    var urls = ['floor.js', 'bar2.js', 'bar3.js', 'bar.js',
            'disc1.js', 'disc2.js', 'disc3.js', 'disc4.js', 'disc5.js',
            'hitbar.js', 'hitbar.js', 'hitbar.js'];
    urls.forEach(function(url, index) {
        ++depth;
        load(url, function(text) {
            MODELTEXT[index] = JSON.parse(text);
            dec();
        });
    });

    load('vertex.glsl', function(text) {
        VERTEX_SHADER = text;
        dec();
    });

    load('fragment.glsl', function(text) {
        FRAGMENT_SHADER = text;
        dec();
    });
}

onload = function() {
    console.debug('onload');
    document.body.style.cursor = 'wait';
    loadAll(run);
};

function initModelPos() {
    MODELTEXT[0].y = -4;

    MODELTEXT[1].x = -6;
    MODELTEXT[1].y = -4;
    MODELTEXT[2].x = 6;
    MODELTEXT[2].y = -4;
    MODELTEXT[3].y = 6;

    MODELTEXT[4].x = -6;
    MODELTEXT[4].y = -4;
    MODELTEXT[4].z = 3;
    MODELTEXT[5].x = -6;
    MODELTEXT[5].y = -4;
    MODELTEXT[5].z = 2.5;
    MODELTEXT[6].x = -6;
    MODELTEXT[6].y = -4;
    MODELTEXT[6].z = 2;
    MODELTEXT[7].x = -6;
    MODELTEXT[7].y = -4;
    MODELTEXT[7].z = 1.5;
    MODELTEXT[8].x = -6;
    MODELTEXT[8].y = -4;
    MODELTEXT[8].z = 1;

    MODELTEXT[9].hit = true;
    MODELTEXT[9].x = -6;
    MODELTEXT[9].y = -4;
    MODELTEXT[10].hit = true;
    MODELTEXT[10].x = 6;
    MODELTEXT[10].y = -4;
    MODELTEXT[11].hit = true;
    MODELTEXT[11].y = 6;
}

var dirty = true;
var app = null;

function run() {
    initModelPos();

    var canvas = document.getElementsByTagName('canvas')[0];
    app = new App(canvas.getContext('experimental-webgl'),
            MODELTEXT, VERTEX_SHADER, FRAGMENT_SHADER);

    (onresize = function() {
        console.debug('onresize');
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        app.resize(innerWidth, innerHeight);
        dirty = true;
    })();

    setInterval(function() {
        if (dirty) {
            app.draw();
            dirty = false;
        }
    }, 30);

    document.body.style.cursor = 'default';
}
