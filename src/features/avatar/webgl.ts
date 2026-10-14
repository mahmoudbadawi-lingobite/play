let cached: boolean | undefined;

/** True when this browser can run WebGL (checked once, no three.js needed). */
export function webglAvailable(): boolean {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement('canvas');
    cached = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}

/** Phones / small laptops get lighter rendering (no shadows, lower resolution). */
export function lowPowerDevice(): boolean {
  try {
    const forced = window.localStorage.getItem('lingobite:quality');
    if (forced === 'low') return true;
    if (forced === 'high') return false;
  } catch {
    // ignore
  }
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return mobile && (navigator.hardwareConcurrency ?? 4) <= 4;
}
