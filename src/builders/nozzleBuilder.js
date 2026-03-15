import * as THREE from 'three';
import { createNozzleAssembly } from '../domain/nozzles/nozzle.js';
import { createManholeAssembly } from '../domain/nozzles/manhole.js';

function sectionRadiusAt(section, localOffset) {
  if (section.type !== 'tapered') return section.odStart / 2;
  const t = Math.max(0, Math.min(1, (localOffset + section.length / 2) / section.length));
  return (section.odStart / 2) + ((section.odEnd / 2) - (section.odStart / 2)) * t;
}

export function addNozzles({ group, model, layout, materials }) {
  model.nozzles?.forEach((item) => {
    if (!item.enabled) return;
    const section = layout[item.location.sectionIndex ?? 0] || layout[0];
    const nozzleMesh = (item.type === 'manhole' ? createManholeAssembly : createNozzleAssembly)({ nozzle: item, material: materials.accent, accentMaterial: materials.accent });

    if (item.location.mode === 'radial') {
      const angle = (item.location.angle * Math.PI) / 180;
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
      const localRadius = sectionRadiusAt(section, item.location.offset || 0);
      nozzleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radial);
      nozzleMesh.position.copy(radial.clone().multiplyScalar(localRadius + item.neck.projection / 2));
      nozzleMesh.position.y = section.center + (item.location.offset || 0);
    } else if (item.location.mode === 'axial-front') {
      nozzleMesh.rotation.z = Math.PI;
      nozzleMesh.position.y = layout[0].start - item.neck.projection / 2;
    } else {
      nozzleMesh.position.y = layout.at(-1).end + item.neck.projection / 2;
    }

    group.add(nozzleMesh);
  });
}
