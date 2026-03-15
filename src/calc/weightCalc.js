import { getHeadHeight } from '../domain/body/head.js';
import { MM3_TO_M3 } from '../utils/constants.js';

function shellSteelVolume(section, ca = 0) {
  const t = Math.max(section.thickness - ca, 1);
  const ro1 = section.odStart / 2;
  const ro2 = section.odEnd / 2;
  const ri1 = Math.max(ro1 - t, 1);
  const ri2 = Math.max(ro2 - t, 1);
  return Math.PI * section.length * ((ro1*ro1 + ro1*ro2 + ro2*ro2) - (ri1*ri1 + ri1*ri2 + ri2*ri2)) / 3;
}

function headSteelVolume(od, thickness, type, ca = 0) {
  const ro = od / 2;
  const ri = Math.max(ro - Math.max(thickness - ca, 1), 1);
  const ho = getHeadHeight(type, ro);
  const hi = Math.max(ho - Math.max(thickness - ca, 1), 1);
  if (type === 'flat') return Math.PI * (ro*ro - ri*ri) * Math.max(thickness - ca, 1);
  return Math.abs((Math.PI * ho * (3 * ro * ro + ho * ho)) / 6 - (Math.PI * hi * (3 * ri * ri + hi * hi)) / 6);
}

export function getSteelMassKg(model, density, ca = 0) {
  let mm3 = model.body.shellSections.reduce((sum, section) => sum + shellSteelVolume(section, ca), 0);
  if (model.body.heads.front?.enabled) mm3 += headSteelVolume(model.body.heads.front.od || model.body.shellSections[0].odStart, model.body.heads.front.thickness || model.body.shellSections[0].thickness, model.body.heads.front.type, ca);
  if (model.body.heads.rear?.enabled) {
    const last = model.body.shellSections.at(-1);
    mm3 += headSteelVolume(model.body.heads.rear.od || last.odEnd, model.body.heads.rear.thickness || last.thickness, model.body.heads.rear.type, ca);
  }
  return mm3 * MM3_TO_M3 * density;
}
