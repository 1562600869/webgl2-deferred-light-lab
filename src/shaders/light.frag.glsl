#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform float uIntensity;
uniform float uExposure;
out vec4 fragColor;
void main(){ vec3 albedo=texture(uAlbedo,vUv).rgb; fragColor=vec4(albedo*0.05*uExposure,1.0);}
