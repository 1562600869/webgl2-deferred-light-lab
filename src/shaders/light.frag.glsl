#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform sampler2D uPosition;
uniform vec3 uCamPos;
uniform vec3 uLightPos[3];
uniform vec3 uLightColor[3];
uniform float uIntensity;
uniform float uExposure;
uniform float uShininess;
uniform float uPack;
out vec4 fragColor;

// Matches src/math/light.js
float attenuation(float d){ return 1.0/(1.0+0.7*d+1.8*d*d); }

void main(){
  vec4 nrm=texture(uNormal,vUv);
  if(nrm.a<0.5){ fragColor=vec4(0.0,0.0,0.0,1.0); return; }
  vec3 albedo=texture(uAlbedo,vUv).rgb;
  vec3 N=normalize(uPack>0.5?nrm.rgb*2.0-1.0:nrm.rgb);
  vec3 P=texture(uPosition,vUv).rgb;
  if(uPack>0.5) P=P*2.0-1.0;
  vec3 V=normalize(uCamPos-P);
  vec3 color=albedo*0.05;
  for(int i=0;i<3;i++){
    vec3 L=uLightPos[i]-P;
    float dist=length(L);
    L/=max(dist,1e-4);
    float att=attenuation(dist);
    float nDotL=max(dot(N,L),0.0);
    vec3 H=normalize(L+V);
    float spec=pow(max(dot(N,H),0.0),uShininess);
    vec3 radiance=uLightColor[i]*uIntensity*att;
    color+=(albedo*nDotL+vec3(spec))*radiance;
  }
  color=vec3(1.0)-exp(-color*uExposure);
  color=pow(color,vec3(1.0/2.2));
  fragColor=vec4(color,1.0);
}
