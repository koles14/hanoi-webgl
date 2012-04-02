precision mediump float;

uniform int u_pick;
uniform bool uTexturing;
uniform sampler2D uSample;

varying vec2 v_Texcoord;
varying float v_intensity;
//varying float v_specular;
const float v_specular = 0.0;

const vec4 v_Color = vec4(0.5, 0.5, 0.5, 1.0);

void main()
{
    if (u_pick > 0) {
        gl_FragColor = vec4(float(u_pick) * 0.00390625, 0, float(u_pick) * 0.0625, 1);
    } else if (uTexturing) {
        vec4 color = texture2D(uSample, v_Texcoord);
        gl_FragColor = vec4(/*vec3(1.0, 0.9, 0.8) * v_specular +*/
                color.rgb * (v_intensity * 0.6 + 0.4), color.a);
    } else {
        gl_FragColor = vec4(v_Color.rgb * (v_intensity * 0.6 + 0.4), v_Color.a);
    }
}
