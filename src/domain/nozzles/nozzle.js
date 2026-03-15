import * as THREE from 'three';
import { createPipeNeck } from './pipeNeck.js';
import { createFlange } from './flange.js';
import { createBlindFlange } from './blindFlange.js';
import { createReinforcementPad } from './reinforcementPad.js';
import { createLabel } from './common.js';

export function createNozzleAssembly({ nozzle, material, accentMaterial }) {
  const group = new THREE.Group();
  const neck = createPipeNeck({ od: nozzle.neck.od, thickness: nozzle.neck.thickness, length: nozzle.neck.projection, material });
  group.add(neck);

  if (nozzle.reinforcementPad?.enabled) {
    const pad = createReinforcementPad({ od: nozzle.reinforcementPad.od, neckOD: nozzle.neck.od, thickness: nozzle.reinforcementPad.thickness || nozzle.neck.thickness, material: accentMaterial });
    pad.position.y = -nozzle.neck.projection / 2 + (nozzle.reinforcementPad.thickness || nozzle.neck.thickness) / 2;
    group.add(pad);
  }

  if (nozzle.flange?.enabled) {
    const flange = createFlange({ od: nozzle.neck.od * 1.65, neckOD: nozzle.neck.od, thickness: Math.max(nozzle.neck.thickness * 1.8, 16), material: accentMaterial, boltCount: nozzle.type === 'manhole' ? 12 : 8 });
    flange.position.y = nozzle.neck.projection / 2 - Math.max(nozzle.neck.thickness * 1.8, 16) / 2;
    group.add(flange);
  }

  if (nozzle.blindFlange?.enabled) {
    const blind = createBlindFlange({ od: nozzle.neck.od * 1.65, thickness: Math.max(nozzle.neck.thickness * 1.8, 16), material: accentMaterial });
    blind.position.y = nozzle.neck.projection / 2 + Math.max(nozzle.neck.thickness * 1.8, 16) / 2;
    group.add(blind);
  }

  const label = createLabel(nozzle.tag, { scale: Math.max(nozzle.neck.od * 0.7, 160) });
  label.position.set(0, nozzle.neck.projection * 0.9, nozzle.neck.od * 0.95);
  group.add(label);
  group.userData.exportable = true;
  return group;
}
