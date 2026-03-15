export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => (rad * 180) / Math.PI;
export const round = (value, digits = 3) => Number.parseFloat(value.toFixed(digits));
export const lerp = (a, b, t) => a + (b - a) * t;
