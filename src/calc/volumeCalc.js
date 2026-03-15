import { MM3_TO_M3 } from '../utils/constants.js';
import { getHeadHeight } from '../domain/body/head.js';

function sectionVolume(section) {
  const ro1 = section.odStart / 2 - section.thickness;
  const ro2 = section.odEnd / 2 - section.thickness;
  return Math.PI * section.length * (ro1 * ro1 + ro1 * ro2 + ro2 * ro2) / 3;
}

function headVolume(od, thickness, type) {
  const r = od / 2 - thickness;
  const h = Math.max(getHeadHeight(type, od / 2) - thickness, 1);
  if (type === 'flat') return Math.PI * r * r * Math.max(thickness, 1);
  return (Math.PI * h * (3 * r * r + h * h)) / 6;
}

export function getInternalVolumeM3(model) {
  let mm3 = model.body.shellSections.reduce((sum, section) => sum + sectionVolume(section), 0);
  if (model.body.heads.front?.enabled) mm3 += headVolume(model.body.heads.front.od || model.body.shellSections[0].odStart, model.body.heads.front.thickness || model.body.shellSections[0].thickness, model.body.heads.front.type);
  if (model.body.heads.rear?.enabled) {
    const last = model.body.shellSections.at(-1);
    mm3 += headVolume(model.body.heads.rear.od || last.odEnd, model.body.heads.rear.thickness || last.thickness, model.body.heads.rear.type);
  }
  return mm3 * MM3_TO_M3;
}
