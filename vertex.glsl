uniform vec3 u_rotate;
uniform vec4 u_translate;
uniform vec2 u_scale;

attribute vec4 vNormal;
attribute vec2 vTexcoord;
attribute vec4 vPosition;

const float zNear = 0.1;
const float zFar = 100.0;

varying vec2 v_Texcoord;
varying float v_intensity;
//varying float v_specular;

mat4 rotateZ(float rad)
{
    return mat4(cos(rad),  sin(rad), 0, 0,
                -sin(rad), cos(rad), 0, 0,
                0,         0,        1, 0,
                0,         0,        0, 1);
}

mat4 rotateX(float rad)
{
    return mat4(1, 0,         0,        0,
                0, cos(rad),  sin(rad), 0,
                0, -sin(rad), cos(rad), 0,
                0, 0,         0,        1);
}

const vec4 light = vec4(-30, -20, 10, 0);

void main()
{
    v_intensity =
            60. * pow(length(light - vPosition - u_translate), -1.0) *
            dot(normalize(light - vPosition - u_translate), vNormal);

    v_Texcoord = vTexcoord;

    vec4 cameraPos = vPosition + u_translate;
    cameraPos = rotateX(u_rotate.y) * rotateZ(u_rotate.x) * cameraPos;
    cameraPos.z -= u_rotate.z;

    /*
    vec3 lightDir = normalize(light.xyz - vPosition.xyz - u_translate.xyz);
    vec3 h = normalize(lightDir - normalize(cameraPos.xyz));
    v_specular = pow(clamp(dot(vNormal.xyz, h), 0.0, 1.0), 99.0);
    */

    vec4 clipPos;
    
    clipPos.xy = cameraPos.xy * u_scale.xy;
    
    clipPos.z = cameraPos.z * (zNear + zFar) / (zNear - zFar);
    clipPos.z += 2.0 * zNear * zFar / (zNear - zFar);
    
    clipPos.w = -cameraPos.z;
    
    gl_Position = clipPos;
}
