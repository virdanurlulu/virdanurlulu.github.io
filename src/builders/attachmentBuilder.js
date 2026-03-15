import { createLiftingLug } from '../domain/externalAttachments/liftingLug.js';
import { createTailingBeam } from '../domain/externalAttachments/tailingBeam.js';
import { createNamePlate } from '../domain/externalAttachments/namePlate.js';
import { createEarthingBoss } from '../domain/externalAttachments/earthingBoss.js';
import { createClip } from '../domain/externalAttachments/clips.js';

export function addExternalAttachments({ group, model, layout, materials }) {
  const shell = layout[0];
  const radius = shell.odStart / 2;
  model.externalAttachments?.forEach((item, index) => {
    if (!item.enabled) return;
    let mesh = null;
    if (item.type === 'liftingLug' || item.type === 'liftingPad') mesh = createLiftingLug({ material: materials.attachment });
    else if (item.type === 'tailingLug' || item.type === 'tailingBeam') mesh = createTailingBeam({ material: materials.attachment });
    else if (item.type === 'namePlate') mesh = createNamePlate({ material: materials.attachment });
    else if (item.type === 'earthingBoss') mesh = createEarthingBoss({ material: materials.attachment });
    else mesh = createClip({ material: materials.attachment });
    mesh.position.set((index - 1.5) * 260, radius * 0.2, radius * 1.02);
    group.add(mesh);
  });
}
