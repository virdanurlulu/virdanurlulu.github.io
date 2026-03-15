import * as THREE from 'three';
import { createHead, createClosureRing } from './head.js';
import { createOpenShellSection } from './shell.js';

function cylinder(radius, length, material, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, seg), material);
  m.userData.exportable = true;
  return m;
}

export function createQuickOpeningClosure({ radius, thickness, type, materialBase, materialAccent, segments = 64 }) {
  const group = new THREE.Group();
  const seatLength = Math.max(thickness * 3.4, 70);
  const seat = createOpenShellSection({
    radiusBottom: radius,
    radiusTop: radius,
    thickness,
    length: seatLength,
    segments,
    material: materialAccent,
  });
  seat.position.y = -seatLength / 2;
  group.add(seat);

  const clampRing = createClosureRing({ radius: radius * 1.015, thickness: Math.max(thickness * 1.2, 12), material: materialAccent });
  clampRing.rotation.y = Math.PI / 2;
  group.add(clampRing);

  const door = createHead({ type, radius, thickness, segments, material: materialBase, isTop: false });
  door.group.position.y = -seatLength - Math.max(thickness * 1.3, 26);
  group.add(door.group);

  const hinge = cylinder(Math.max(thickness * 0.22, 10), radius * 0.34, materialAccent, 16);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(radius * 0.98, -seatLength * 0.58, 0);
  group.add(hinge);

  const davitStem = cylinder(Math.max(thickness * 0.16, 8), radius * 0.72, materialAccent, 14);
  davitStem.position.set(radius * 1.16, -seatLength * 1.12, 0);
  group.add(davitStem);

  const davitArm = cylinder(Math.max(thickness * 0.15, 7), radius * 0.82, materialAccent, 14);
  davitArm.rotation.z = Math.PI / 2;
  davitArm.position.set(radius * 1.16, -seatLength * 1.4, 0);
  group.add(davitArm);

  const handWheel = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.13, Math.max(thickness * 0.09, 5), 12, 28), materialAccent);
  handWheel.rotation.y = Math.PI / 2;
  handWheel.position.set(radius * 1.45, -seatLength * 1.48, 0);
  group.add(handWheel);

  group.userData.exportable = true;
  return { group, length: seatLength };
}
