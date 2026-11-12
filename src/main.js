import { init } from './renderer.js';
import { bindControls } from './ui/controls.js';
const status = document.querySelector('#status');
const canvas = document.querySelector('#gl');
try {
  const api = await init(canvas);
  bindControls(api);
  status.textContent = 'ready';
  const loop = () => { api.render(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} catch (err) {
  status.textContent = `error: ${err.message || err}`;
}
