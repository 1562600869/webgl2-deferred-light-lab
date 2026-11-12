export function createUVSphere(lat = 24, lon = 32) {
  const positions = [], normals = [], indices = [];
  for (let y = 0; y <= lat; y++) {
    const v = y / lat, phi = v * Math.PI;
    for (let x = 0; x <= lon; x++) {
      const u = x / lon, theta = u * Math.PI * 2;
      const nx = Math.sin(phi) * Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(theta);
      positions.push(nx, ny, nz); normals.push(nx, ny, nz);
    }
  }
  for (let y = 0; y < lat; y++) for (let x = 0; x < lon; x++) {
    const a = y * (lon + 1) + x, b = a + lon + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}
