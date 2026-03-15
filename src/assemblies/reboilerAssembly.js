import * as THREE from 'three';
import { buildShellTrain, addHeads, addInterfaces } from '../builders/bodyBuilder.js';
import { addNozzles } from '../builders/nozzleBuilder.js';
import { addSupports } from '../builders/supportBuilder.js';
import { addExternalAttachments } from '../builders/attachmentBuilder.js';
import { addInternalAttachments } from '../builders/internalBuilder.js';
import { orientEquipment } from '../utils/transforms.js';

export function buildReboilerAssembly({ model, materials, segments, weld }) {
  const group = new THREE.Group();
  group.name = 'Reboiler';
  const { group: shellGroup, layout } = buildShellTrain({ shellSections: model.body.shellSections, material: materials.base, segments });
  group.add(shellGroup);
  addHeads({ group, layout, heads: model.body.heads, material: materials.base, accentMaterial: materials.accent, segments, weld });
  addInterfaces({ group, layout, bodyFlanges: model.body.bodyFlanges, material: materials.accent, accentMaterial: materials.accent, weld, segments });
  addNozzles({ group, model, layout, materials });
  addSupports({ group, model, layout, materials });
  addExternalAttachments({ group, model, layout, materials });
  addInternalAttachments({ group, model, layout, materials });
  orientEquipment(group, model.body.orientation);
  return group;
}
