import * as THREE from 'three';
import { createOpenShellSection } from '../domain/body/shell.js';
import { createHead } from '../domain/body/head.js';
import { createBodyFlange } from '../domain/body/bodyFlange.js';
import { createQuickOpeningClosure } from '../domain/body/closure.js';
import { createShellHeadWeld, createTransitionWeld, createWeldMaterial } from './weldedJoin.js';

export function buildShellTrain({ shellSections, material, segments }) {
  const group = new THREE.Group();
  const layout = [];
  const totalLength = shellSections.reduce((sum, s) => sum + s.length, 0);
  let cursor = -totalLength / 2;

  shellSections.forEach((section, index) => {
    const center = cursor + section.length / 2;
    const mesh = createOpenShellSection({
      radiusBottom: section.odStart / 2,
      radiusTop: section.odEnd / 2,
      thickness: section.thickness,
      length: section.length,
      segments,
      material,
    });
    mesh.position.y = center;
    group.add(mesh);
    layout.push({ index, center, start: cursor, end: cursor + section.length, ...section });
    cursor += section.length;
  });

  return { group, layout, totalLength };
}

export function addHeads({ group, layout, heads, material, accentMaterial, segments, weld, flangeRadiusOverride = null }) {
  const first = layout[0];
  const last = layout[layout.length - 1];

  if (heads.front?.enabled) {
    const head = createHead({ type: heads.front.type, radius: (heads.front.od || first.odStart) / 2, thickness: heads.front.thickness || first.thickness, segments, material, isTop: false });
    head.group.position.y = first.start;
    group.add(head.group);
    if (weld.enabled) {
      const weldMesh = createShellHeadWeld({ radius: flangeRadiusOverride || (heads.front.od || first.odStart) / 2, thickness: heads.front.thickness || first.thickness, y: first.start, material: createWeldMaterial(accentMaterial), style: weld.type, sizeFactor: weld.sizeFactor });
      group.add(weldMesh);
    }
  }

  if (heads.rear?.enabled) {
    const head = createHead({ type: heads.rear.type, radius: (heads.rear.od || last.odEnd) / 2, thickness: heads.rear.thickness || last.thickness, segments, material, isTop: true });
    head.group.position.y = last.end;
    group.add(head.group);
    if (weld.enabled) {
      const weldMesh = createShellHeadWeld({ radius: flangeRadiusOverride || (heads.rear.od || last.odEnd) / 2, thickness: heads.rear.thickness || last.thickness, y: last.end, material: createWeldMaterial(accentMaterial), style: weld.type, sizeFactor: weld.sizeFactor });
      group.add(weldMesh);
    }
  }
}

export function addInterfaces({ group, layout, bodyFlanges, material, accentMaterial, weld, segments = 48 }) {
  if (!Array.isArray(bodyFlanges)) return;
  bodyFlanges.filter((item) => item.enabled).forEach((flange) => {
    let y = null;
    if (typeof flange.sectionInterface === 'number') {
      const left = layout[flange.sectionInterface];
      y = left?.end ?? null;
    } else if (flange.location === 'front-end') {
      y = layout[0]?.start ?? null;
    } else if (flange.location === 'rear-end') {
      y = layout.at(-1)?.end ?? null;
    }
    if (y == null) return;
    const mesh = createBodyFlange({ od: flange.od, thickness: flange.thickness, width: flange.width, material, segments });
    mesh.position.y = y + (flange.width / 2) * (flange.location === 'front-end' ? -1 : 1);
    group.add(mesh);
    if (weld.enabled && typeof flange.sectionInterface === 'number') {
      const left = layout[flange.sectionInterface];
      const right = layout[flange.sectionInterface + 1];
      const weldMesh = createTransitionWeld({ radiusA: left.odEnd / 2, radiusB: right.odStart / 2, y, thickness: Math.min(left.thickness, right.thickness), material: createWeldMaterial(accentMaterial), style: weld.type, sizeFactor: weld.sizeFactor });
      group.add(weldMesh);
    }
  });
}

export function addClosure({ group, layout, closure, materialBase, materialAccent, segments }) {
  if (!closure?.enabled) return;
  const first = layout[0];
  const qoc = createQuickOpeningClosure({ radius: first.odStart / 2, thickness: closure.thickness || first.thickness, type: closure.type || 'flat', materialBase, materialAccent, segments });
  qoc.group.position.y = first.start;
  group.add(qoc.group);
}
