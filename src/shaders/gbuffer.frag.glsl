#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorldPos;
uniform float uPack;
layout(location=0) out vec4 oAlbedo;
layout(location=1) out vec4 oNormal;
layout(location=2) out vec4 oPosition;
void main(){
  vec3 n=normalize(vNormal);
  oAlbedo=vec4(0.75,0.55,0.45,1.0);
  oNormal=vec4(uPack>0.5?n*0.5+0.5:n,1.0);
  oPosition=vec4(uPack>0.5?vWorldPos*0.5+0.5:vWorldPos,1.0);
}
