function App(gl, modelData, vertexShaderSource, fragmentShaderSource) {
    console.debug('App');

    if (!gl) {
        throw new Error('No WebGL context given');
    }
    this.gl = gl;

    function $(id) { return document.getElementById(id) }

    this.VERTEX_SHADER_ATTRIBS = vertexShaderSource.match(/attribute\s+\w+\s+\w+/g).map(function(e) {
        return e.split(/\s+/g)[2]; });
    this.VERTEX_SHADER_SOURCE = vertexShaderSource;
    this.FRAGMENT_SHADER_SOURCE = fragmentShaderSource;

    this.models = modelData;
    this.models.forEach(this.createModel, this);

    this.rotateX = 0;
    this.rotateY = 0.25 * Math.PI;
    this.zoom = 25;

    this.init();
}

App.prototype = {

    viewport: false,

    HITSIZE: 512,

    createShader: function(type, source) {
        console.debug('createShader');
        var gl = this.gl;

        var shader = gl.createShader(type);
        if (!shader) {
            throw new Error('Cannot create a shader');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    },

    createProgram: function(shaders, attribs) {
        console.debug('createProgram');
        var gl = this.gl;

        var program = gl.createProgram();
        if (!program) {
            throw new Error('Cannot create a program');
        }
        shaders.forEach(function(shader) {
            gl.attachShader(program, shader);
        });
        attribs.forEach(function(attrib, index) {
            gl.bindAttribLocation(program, index, attrib);
            gl.enableVertexAttribArray(index);
        });
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        return program;
    },

    init: function() {
        console.debug('init');
        var gl = this.gl;

        var vertexShader = this.createShader(gl.VERTEX_SHADER, this.VERTEX_SHADER_SOURCE);
        var fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.FRAGMENT_SHADER_SOURCE);
        var program = this.createProgram([ vertexShader, fragmentShader ], this.VERTEX_SHADER_ATTRIBS);
        gl.useProgram(program);

        this.locRotation = gl.getUniformLocation(program, 'u_rotate');
        this.locTranslate = gl.getUniformLocation(program, 'u_translate');
        this.locScale = gl.getUniformLocation(program, 'u_scale');
        this.locPick = gl.getUniformLocation(program, 'u_pick');
        this.locTexture = gl.getUniformLocation(program, 'uTexturing');
        //this.locSample = gl.getUniformLocation(program, 'uSample');

        var framebuffer = this.hitTestFrameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.HITSIZE, this.HITSIZE,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        var depthRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.HITSIZE, this.HITSIZE);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

        if (!gl.isFramebuffer(framebuffer) ||
                gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('No framebuffer support.');
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    },

    createArrayBuffer: function(type, data) {
        console.debug('createArrayBuffer');
        var gl = this.gl;

        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        gl.bindBuffer(type, null);
        return buffer;
    },

    createModel: function(data) {
        console.debug('createModel');
        var gl = this.gl;

        var vertices = new Float32Array(data.vertex);
        var normals = new Float32Array(data.normal);
        var texcoords = new Float32Array(data.texcoord);
        var indices = new Uint16Array(data.index);

        data.buffers = {};

        if (data.texture) {
            var app = this;
            var image = new Image;
            image.onload = function() {
                console.debug('createTexture');
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.bindTexture(gl.TEXTURE_2D, null);
                data.buffers.texture = texture;
                image.onload = null;
                if (!gl.isTexture(texture))
                    throw new Error('Cannot create a texture');
                app.draw();
                app = null;
            };
            image.src = data.texture;
        }

        data.buffers.vertex = this.createArrayBuffer(gl.ARRAY_BUFFER, vertices);
        data.buffers.normal = this.createArrayBuffer(gl.ARRAY_BUFFER, normals);
        data.buffers.texcoord = this.createArrayBuffer(gl.ARRAY_BUFFER, texcoords);
        data.buffers.index = this.createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
        data.buffers.count = indices.length;
    },

    draw: function(picking) {
        console.debug(picking ? 'draw:offscreen' : 'draw');
        var gl = this.gl;

        if (picking) {
            gl.viewport(0, 0, this.HITSIZE, this.HITSIZE);
            gl.clearColor(0, 1, 0, 1);
            this.refreshOffscreen = false;
        } else {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            this.refreshOffscreen = true;
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform3f(this.locRotation, -this.rotateX, -this.rotateY, this.zoom);
        gl.uniform2f(this.locScale, this.scaleX, this.scaleY);
        gl.uniform1i(this.locPick, 0);

        this.models.forEach(function(model, index) {
            if (picking ? !model.hit : model.hit)
                return;

            if (picking)
                gl.uniform1i(this.locPick, index + 1);

            gl.uniform4f(this.locTranslate, model.x || 0, model.y || 0, model.z || 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.vertex);
            gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.normal);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.texcoord);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.buffers.index);

            if (!picking && model.buffers.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, model.buffers.texture);
                gl.uniform1i(this.locTexture, true);
                //gl.uniform1i(this.locSample, 0);
            } else {
                gl.uniform1i(this.locTexture, false);
            }

            gl.drawElements(gl.TRIANGLES, model.buffers.count, gl.UNSIGNED_SHORT, 0);

            gl.bindTexture(gl.TEXTURE_2D, null);

        }, this);

        gl.flush();

        //gl.bindTexture(gl.TEXTURE_2D, null);
        //gl.bindTexture(gl.ARRAY_BUFFER, null);
        //gl.bindTexture(gl.ELEMENT_ARRAY_BUFFER, null);
    },

    select: function(x, y) {
        console.debug('select');
        var gl = this.gl;

        var px = this.HITSIZE * x / gl.canvas.width | 0;
        var py = this.HITSIZE - 1 - (this.HITSIZE * y / gl.canvas.height | 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.hitTestFrameBuffer);

        if (this.refreshOffscreen)
            this.draw(true);

        try {
            var pixels = gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE);
        } catch (e) { }
        if (!pixels) {
            pixels = new Uint8Array(1 * 1 * 4);
            gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return pixels[0] - 1;
    },

    resize: function(width, height) {
        this.viewport = true;
        this.scaleX = height > width ? height / width : 1;
        this.scaleY = width > height ? width / height : 1;
    },

    rotateCamera: function(rotX, rotY) {
        this.rotateX += rotX;
        this.rotateY = Math.max(0.1 * Math.PI, Math.min(0.45 * Math.PI, this.rotateY + rotY));
    },

    zoomCamera: function(delta) {
        this.zoom = Math.max(15, Math.min(40, this.zoom + delta));
    }
};
