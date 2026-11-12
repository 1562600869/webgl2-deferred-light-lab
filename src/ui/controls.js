export function bindControls(api) {
  const status = document.querySelector('#status');
  const stats = document.querySelector('#stats');
  const fail = (err) => { status.textContent = `error: ${err.message || err}`; };

  const updateStats = () => {
    const s = api.getStats();
    stats.textContent = [
      `lightCount: ${s.lightCount}`,
      `exposure: ${s.exposure.toFixed(2)}`,
      `intensity: ${s.intensity.toFixed(2)}`,
    ].join('\n');
  };

  document.querySelectorAll('#controls input[data-key]').forEach((input) => {
    input.addEventListener('input', () => {
      try {
        api.setParams({ [input.dataset.key]: parseFloat(input.value) });
        updateStats();
      } catch (err) { fail(err); }
    });
  });

  const captureBtn = document.querySelector('#btn-capture');
  captureBtn.addEventListener('click', () => {
    try {
      const url = api.capture();
      if (!url) throw new Error('capture failed');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deferred-light-lab.png';
      a.click();
    } catch (err) { fail(err); }
  });

  updateStats();
}
