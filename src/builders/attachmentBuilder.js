import { createLiftingLug } from '../domain/externalAttachments/liftingLug.js';
import { createTailingBeam } from '../domain/externalAttachments/tailingBeam.js';
import { createNamePlate } from '../domain/externalAttachments/namePlate.js';
import { createEarthingBoss } from '../domain/externalAttachments/earthingBoss.js';
import { createClip } from '../domain/externalAttachments/clips.js';

function shellRadius(layout) {
  const shell = layout.find((section) => section.odStart === section.odEnd) || layout[0];
  return shell.odStart / 2;
}

function totalLength(layout) {
  return layout.reduce((sum, section) => sum + section.length, 0);
}

function axialStations(layout) {
  const length = totalLength(layout);
  return {
    front: -length * 0.26,
    midFront: -length * 0.12,
    midRear: length * 0.12,
    rear: length * 0.26,
  };
}

export function addExternalAttachments({ group, model, layout, materials }) {
  const radius = shellRadius(layout);
  const stations = axialStations(layout);

  model.externalAttachments?.forEach((item) => {
    if (!item.enabled) return;

    if (item.type === 'liftingLug' || item.type === 'liftingPad') {
      const lugA = createLiftingLug({ size: Math.max(radius * 0.12, 140), material: materials.attachment });
      const lugB = createLiftingLug({ size: Math.max(radius * 0.12, 140), material: materials.attachment });
      lugA.position.set(radius * 1.02, stations.midFront, 0);
      lugB.position.set(radius * 1.02, stations.midRear, 0);
      group.add(lugA, lugB);
      return;
    }

    if (item.type === 'tailingLug' || item.type === 'tailingBeam') {
      const tailA = createTailingBeam({ material: materials.attachment });
      const tailB = createTailingBeam({ material: materials.attachment });
      tailA.position.set(radius * 0.92, stations.front, radius * 0.18);
      tailB.position.set(radius * 0.92, stations.rear, -radius * 0.18);
      group.add(tailA, tailB);
      return;
    }

    if (item.type === 'namePlate') {
      const plate = createNamePlate({ width: 240, height: 110, thickness: 8, material: materials.attachment });
      plate.position.set(radius * 0.18, stations.midFront, radius * 1.01);
      group.add(plate);
      return;
    }

    if (item.type === 'earthingBoss') {
      const boss = createEarthingBoss({ radius: 18, length: 28, material: materials.attachment });
      boss.position.set(-radius * 0.68, stations.front, radius * 0.96);
      group.add(boss);
      return;
    }

    const clipA = createClip({ material: materials.attachment });
    const clipB = createClip({ material: materials.attachment });
    clipA.position.set(radius * 0.52, stations.front, radius * 0.94);
    clipB.position.set(radius * 0.52, stations.rear, radius * 0.94);
    group.add(clipA, clipB);
  });
}
