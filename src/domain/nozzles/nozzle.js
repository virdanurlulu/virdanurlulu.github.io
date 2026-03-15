import * as THREE from 'three';
import { createPipeNeck } from './pipeNeck.js';
import { createFlange } from './flange.js';
import { createBlindFlange } from './blindFlange.js';
import { createReinforcementPad } from './reinforcementPad.js';
import { createGasket } from './gasket.js';
import { createStudBoltRing } from './studBolt.js';
import { createLabel } from './common.js';

export function createNozzleAssembly({ nozzle, material, accentMaterial }) {
  const group = new THREE.Group();
  const neck = createPipeNeck({ od: nozzle.neck.od, thickness: nozzle.neck.thickness, length: nozzle.neck.projection, material });
  group.add(neck);

  const flangeOD = nozzle.flange?.od || nozzle.neck.od * 1.65;
  const flangeThickness = nozzle.flange?.thickness || Math.max(nozzle.neck.thickness * 1.8, 16);
  const flangeBoltCount = nozzle.flange?.boltCount || (nozzle.type === 'manhole' ? 12 : 8);
  const blindOD = nozzle.blindFlange?.od || flangeOD;
  const blindThickness = nozzle.blindFlange?.thickness || flangeThickness;
  const gasketThickness = nozzle.gasket?.thickness || 3;
  const boltCircleDiameter = nozzle.studBolt?.boltCircleDiameter || flangeOD * 0.87;
  const studDiameter = nozzle.studBolt?.boltDiameter || Math.max(nozzle.neck.od * 0.06, 12);
  const studCount = nozzle.studBolt?.boltCount || flangeBoltCount;
  const studLength = nozzle.studBolt?.boltLength || Math.max(flangeThickness + blindThickness + (nozzle.gasket?.enabled ? gasketThickness : 0) + 12, 42);

  if (nozzle.reinforcementPad?.enabled) {
    const padThickness = nozzle.reinforcementPad.thickness || nozzle.neck.thickness;
    const pad = createReinforcementPad({ od: nozzle.reinforcementPad.od, neckOD: nozzle.neck.od, thickness: padThickness, material: accentMaterial });
    pad.position.y = -nozzle.neck.projection / 2 + padThickness / 2;
    group.add(pad);
  }

  if (nozzle.flange?.enabled) {
    const flange = createFlange({
      od: flangeOD,
      neckOD: nozzle.neck.od,
      thickness: flangeThickness,
      material: accentMaterial,
      boltCount: flangeBoltCount,
      boltCircleDiameter,
      boltDiameter: studDiameter,
      includeBolts: !(nozzle.blindFlange?.enabled && nozzle.studBolt?.enabled),
    });
    flange.position.y = nozzle.neck.projection / 2 - flangeThickness / 2;
    group.add(flange);
  }

  if (nozzle.gasket?.enabled && nozzle.blindFlange?.enabled) {
    const gasketMaterial = accentMaterial.clone();
    gasketMaterial.color = new THREE.Color(0xfbbf24);
    const gasket = createGasket({
      outerRadius: (nozzle.gasket.outerDiameter || flangeOD * 0.9) / 2,
      innerRadius: (nozzle.gasket.innerDiameter || nozzle.neck.od * 1.02) / 2,
      thickness: gasketThickness,
      material: gasketMaterial,
    });
    gasket.position.y = nozzle.neck.projection / 2 + gasketThickness / 2;
    group.add(gasket);
  }

  if (nozzle.blindFlange?.enabled) {
    const blind = createBlindFlange({ od: blindOD, thickness: blindThickness, material: accentMaterial });
    blind.position.y = nozzle.neck.projection / 2 + (nozzle.gasket?.enabled ? gasketThickness : 0) + blindThickness / 2;
    group.add(blind);
  }

  if (nozzle.studBolt?.enabled) {
    const studMaterial = accentMaterial.clone();
    studMaterial.color = new THREE.Color(0xe5e7eb);
    const studs = createStudBoltRing({
      radius: boltCircleDiameter / 2,
      boltRadius: Math.max(studDiameter / 2, 4),
      boltCount: studCount,
      boltLength: studLength,
      material: studMaterial,
    });
    studs.position.y = nozzle.neck.projection / 2 + (nozzle.gasket?.enabled ? gasketThickness : 0) + blindThickness / 2 - flangeThickness / 2;
    group.add(studs);
  }

  const label = createLabel(nozzle.tag, { scale: Math.max(nozzle.neck.od * 0.7, 160) });
  label.position.set(0, nozzle.neck.projection * 0.9, nozzle.neck.od * 0.95);
  group.add(label);
  group.userData.exportable = true;
  return group;
}
