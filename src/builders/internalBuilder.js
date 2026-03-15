import * as THREE from 'three';
import { createTubeSheet } from '../domain/internalAttachments/tubeSheet.js';
import { createBaffleInlet } from '../domain/internalAttachments/baffleInlet.js';
import { createWearPlate } from '../domain/internalAttachments/wearPlate.js';
import { createWeir } from '../domain/internalAttachments/weir.js';
import { createVortexBreaker } from '../domain/internalAttachments/vortexBreaker.js';
import { createDipPipe } from '../domain/internalAttachments/dipPipe.js';
import { createInternalRing } from '../domain/internalAttachments/ring.js';
import { createInternalClip } from '../domain/internalAttachments/clips.js';
import { createInletDistributor } from '../domain/removableInternals/inletDistributor.js';
import { createMistEliminator } from '../domain/removableInternals/mistEliminator.js';
import { createSchoepentoeter } from '../domain/removableInternals/schoepentoeter.js';
import { createTrays } from '../domain/removableInternals/trays.js';
import { createSandJetting } from '../domain/removableInternals/sandJetting.js';

export function addInternalAttachments({ group, model, layout, materials }) {
  const totalLength = layout.reduce((sum, section) => sum + section.length, 0);
  const maxRadius = Math.max(...layout.map((section) => Math.max(section.odStart, section.odEnd) / 2));

  model.internalAttachments?.forEach((item, index) => {
    if (!item.enabled) return;
    let mesh = null;
    if (item.type === 'tubeSheet') mesh = createTubeSheet({ radius: maxRadius * 0.55, thickness: 16, material: materials.internals });
    else if (item.type === 'baffleInlet') mesh = createBaffleInlet({ radius: maxRadius * 0.55, material: materials.internals });
    else if (item.type === 'wearPlate') mesh = createWearPlate({ radius: maxRadius * 0.5, length: totalLength * 0.35, material: materials.internals });
    else if (item.type === 'weir') mesh = createWeir({ radius: maxRadius * 0.5, material: materials.internals });
    else if (item.type === 'vortexBreaker') mesh = createVortexBreaker({ radius: maxRadius * 0.4, material: materials.internals });
    else if (item.type === 'dipPipe') mesh = createDipPipe({ radius: maxRadius * 0.06, length: totalLength * 0.5, material: materials.internals });
    else if (item.type === 'ring') mesh = createInternalRing({ radius: maxRadius * 0.42, thickness: 8, material: materials.internals });
    else mesh = createInternalClip({ material: materials.internals });
    mesh.position.y = (index - 1.5) * 220;
    group.add(mesh);
  });

  model.removableInternals?.forEach((item, index) => {
    if (!item.enabled) return;
    let mesh = null;
    if (item.type === 'inletDistributor') mesh = createInletDistributor({ radius: maxRadius * 0.34, material: materials.internals });
    else if (item.type === 'mistEliminator') mesh = createMistEliminator({ radius: maxRadius * 0.34, material: materials.internals });
    else if (item.type === 'schoepentoeter') mesh = createSchoepentoeter({ radius: maxRadius * 0.28, material: materials.internals });
    else if (item.type === 'trays') mesh = createTrays({ radius: maxRadius * 0.42, material: materials.internals });
    else mesh = createSandJetting({ radius: maxRadius * 0.4, material: materials.internals });
    mesh.position.y = (index - 2) * 320;
    group.add(mesh);
  });

  if (model.meta.equipmentType === 'reboiler') {
    const bundle = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(layout.at(-1).odStart * 0.66, 1200) / 2, Math.min(layout.at(-1).odStart * 0.66, 1200) / 2, layout.at(-1).length * 0.94, 48), materials.internals);
    bundle.rotation.z = Math.PI / 2;
    bundle.position.y = layout[1]?.center || 0;
    bundle.userData.exportable = true;
    group.add(bundle);
  }
}
