#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorldPos;
layout(location=0) out vec4 oAlbedo;
layout(location=1) out vec4 oNormal;
void main(){ oAlbedo=vec4(0.75,0.55,0.45,1.0); oNormal=vec4(normalize(vNormal),1.0); }
