// Keep these formulas in sync with src/shaders/light.frag.glsl.
export function attenuation(distance, constant = 1, linear = 0.7, quadratic = 1.8) {
  const d = Math.max(distance, 0);
  return 1 / (constant + linear * d + quadratic * d * d);
}
export function lambert(nDotL) {
  return Math.max(nDotL, 0);
}
export function blinnPhong(nDotH, shininess) {
  const c = Math.min(Math.max(nDotH, 0), 1);
  return Math.pow(c, Math.max(shininess, 1e-4));
}
