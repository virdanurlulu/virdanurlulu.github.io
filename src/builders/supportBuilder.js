import { createSaddle, createSkirt } from '../domain/supports/saddle.js';
import { createLeg } from '../domain/supports/leg.js';
import { createSupportRing } from '../domain/supports/ring.js';
import { createSupportLug } from '../domain/supports/lug.js';

export function addSupports({ group, model, layout, materials }) {
  const firstSection = layout.find((section) => section.odStart === section.odEnd) || layout[0];
  const barrelRadius = firstSection.odStart / 2;
  const primary = model.supports?.[0];
  if (!primary) return;

  if (primary.type === 'saddle') {
    const s1 = createSaddle({ radius: barrelRadius, width: primary.width, height: primary.height, material: materials.support });
    const s2 = createSaddle({ radius: barrelRadius, width: primary.width, height: primary.height, material: materials.support });
    s1.position.set(-primary.spacing / 2, -barrelRadius, 0);
    s2.position.set(primary.spacing / 2, -barrelRadius, 0);
    group.add(s1, s2);
    return;
  }

  if (primary.type === 'skirt') {
    const skirt = createSkirt({ radius: barrelRadius * 0.62, height: primary.height, thickness: Math.max(firstSection.thickness, 8), material: materials.support });
    skirt.position.y = layout[0].start - primary.height / 2;
    group.add(skirt);
    return;
  }

  if (primary.type === 'leg') {
    const leg1 = createLeg({ width: primary.width * 0.25, height: primary.height, depth: primary.width * 0.3, material: materials.support });
    const leg2 = createLeg({ width: primary.width * 0.25, height: primary.height, depth: primary.width * 0.3, material: materials.support });
    leg1.position.set(-primary.spacing / 2, -barrelRadius, 0);
    leg2.position.set(primary.spacing / 2, -barrelRadius, 0);
    group.add(leg1, leg2);
    return;
  }

  if (primary.type === 'ring') {
    const ring = createSupportRing({ radius: barrelRadius * 1.02, thickness: Math.max(firstSection.thickness, 8), material: materials.support });
    ring.position.y = 0;
    group.add(ring);
    return;
  }

  if (primary.type === 'lug') {
    const lug1 = createSupportLug({ width: primary.width * 0.25, height: primary.height * 0.35, thickness: 18, material: materials.support });
    const lug2 = createSupportLug({ width: primary.width * 0.25, height: primary.height * 0.35, thickness: 18, material: materials.support });
    lug1.position.set(-primary.spacing / 2, 0, barrelRadius * 0.85);
    lug2.position.set(primary.spacing / 2, 0, barrelRadius * 0.85);
    group.add(lug1, lug2);
  }
}
