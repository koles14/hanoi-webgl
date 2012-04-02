var animating = false;

var bucket = [ [ 4, 5, 6, 7, 8 ], [], [] ];

function move(id, dest, timesec) {

    var model = MODELTEXT[id];
    var origin = null;

    var period = timesec * 1000;
    var beginTime = 0;

    return function() {
        if (!origin) {
            origin = {
                x: model.x,
                y: model.y,
                z: model.z
            };
            beginTime = beginTime || Date.now();
        }
        var ratio = Math.min(1, (Date.now() - beginTime) / period);
        model.x = origin.x * (1 - ratio) + dest.x * ratio;
        model.y = origin.y * (1 - ratio) + dest.y * ratio;
        model.z = origin.z * (1 - ratio) + dest.z * ratio;
        dirty = true;
        return ratio >= 1;
    };
}

function start(tasks) {
    if (animating)
        return;
    animating = true;

    console.debug('start');

    var interval = setInterval(function() {
        if (tasks[0]) {
            if (tasks[0]())
                tasks.shift();
        } else {
            clearInterval(interval);
            animating = false;
        }
    }, 20);
}

function moveDisc(from, to) {
    bucket[to].unshift(bucket[from].shift());
    return function() { return true };
}

function task(func) {
    var job = null;
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        if (!job)
            job = func.apply(window, args);
        return job();
    };
}

var POS = [
    { x: -6, y: -4 },
    { x:  6, y: -4 },
    { x:  0, y:  6 } ];

function doMove(from, to) {
    if (bucket[from][0]) {
        var id = bucket[from][0];
        if (id < (bucket[to][0] || Infinity))
        start([
            task(move, id, { x: POS[from].x, y: POS[from].y, z: 7 }, 0.2),
            task(move, id, { x: POS[to].x, y: POS[to].y, z: 7 }, 0.2),
            task(move, id, { x: POS[to].x, y: POS[to].y, z: bucket[to].length * 0.5 + 1 }, 0.2),
            task(moveDisc, from, to)
        ]);
    }
}

var state = 0;
var from = 0;

function stateFrom(code) {
    console.debug('stateFrom');
    switch (code) {
    case 49: // '1'
        from = 0;
        break;
    case 50: // '2'
        from = 1;
        break;
    case 51: // '3'
        from = 2;
        break;
    default:
        return;
    }
    state = 1;
    document.body.className = 'state1';
}

function stateTo(code) {
    console.debug('stateTo');
    var to = from;
    switch (code) {
    case 49: // '1'
        to = 0;
        break;
    case 50: // '2'
        to = 1;
        break;
    case 51: // '3'
        to = 2;
        break;
    default:
        return;
    }
    if (from != to)
        doMove(from, to);
    state = 0;
    document.body.className = 'state0';
}

document.addEventListener('keypress', function(e) {
    var code = e.keyCode;
    switch (state) {
    case 0: stateFrom(code); break;
    case 1: stateTo(code); break;
    }
}, false);

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
}, false);

document.addEventListener('mousedown', function(e) {
    if (e.button != 2)
        return;
    e.preventDefault();

    var prevX = e.clientX,
        prevY = e.clientY;

    function move(e) {
        var currentX = e.clientX,
            currentY = e.clientY;

        app.rotateCamera(0.005 * (prevX - currentX),
                0.005 * (prevY - currentY));
        dirty = true;

        prevX = currentX;
        prevY = currentY;
    }

    function up(e) {
        document.removeEventListener('mousemove', move, false);
        document.removeEventListener('mouseup', up, false);
    };

    document.addEventListener('mousemove', move, false);
    document.addEventListener('mouseup', up, false);
}, false);

document.addEventListener('mousedown', function(e) {
    if (e.button != 0)
        return;
    var selection = app.select(e.clientX, e.clientY);
    if (selection >= 0) {
        switch (state) {
        case 0: stateFrom(selection + 49 - 9); break;
        case 1: stateTo(selection + 49 - 9); break;
        }
    }
}, false);

document.addEventListener('mousewheel', function(e) {
    app.zoomCamera(e.wheelDelta > 0 ? -1 : 1);
    dirty = true;
}, false);
