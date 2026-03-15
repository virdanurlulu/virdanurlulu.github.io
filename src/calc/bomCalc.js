function equipmentTypeLabel(type) {
  return {
    cylindrical: 'Cylindrical Shell',
    tapered: 'Tapered Shell',
    ellipsoidal: '2:1 Ellipsoidal Head',
    hemispherical: 'Hemispherical Head',
    conical: 'Conical Head',
    flat: 'Flat Head',
    flangedNozzle: 'Flanged Nozzle',
    manhole: 'Manhole',
    namePlate: 'Name Plate',
    earthingBoss: 'Earthing Boss',
    liftingLug: 'Lifting Lug',
    tailingLug: 'Tailing Lug',
    clips: 'Clips',
    tubeSheet: 'Tube Sheet',
    baffleInlet: 'Baffle Inlet',
    wearPlate: 'Wear Plate',
    weir: 'Weir',
    vortexBreaker: 'Vortex Breaker',
    dipPipe: 'Dip Pipe',
    ring: 'Ring',
    inletDistributor: 'Inlet Distributor',
    mistEliminator: 'Mist Eliminator',
    schoepentoeter: 'Schoepentoeter',
    trays: 'Trays',
    sandJetting: 'Sand Jetting',
    vent: 'Vent',
    kicker: 'Kicker',
    outlet: 'Outlet',
  }[type] || type;
}

function locationLabel(mode) {
  return {
    radial: 'Radial',
    'axial-front': 'Front Axial',
    'axial-rear': 'Rear Axial',
  }[mode] || mode;
}

function familyLabel(value) {
  return {
    body: 'Body',
    nozzle: 'Nozzles / Manholes',
    support: 'Support',
    external: 'External Attachment',
    internal: 'Internal Attachment',
    removable: 'Removable Internal',
  }[value] || value;
}

export function getBOMRows(model) {
  const rows = [];

  model.body.shellSections?.forEach((item) => {
    rows.push({
      tag: item.tag,
      family: familyLabel('body'),
      type: 'Shell Section',
      description: `${equipmentTypeLabel(item.type)} — OD ${item.odStart} to ${item.odEnd} mm, length ${item.length} mm`,
      qty: 1,
    });
  });

  ['front', 'rear'].forEach((side) => {
    const item = model.body.heads?.[side];
    if (item?.enabled) {
      rows.push({
        tag: item.tag,
        family: familyLabel('body'),
        type: 'Head',
        description: `${side === 'front' ? 'Front' : 'Rear'} ${equipmentTypeLabel(item.type)} — OD ${item.od} mm`,
        qty: 1,
      });
    }
  });

  model.body.bodyFlanges?.filter((item) => item.enabled).forEach((item) => {
    rows.push({
      tag: item.tag,
      family: familyLabel('body'),
      type: 'Body Flange',
      description: `OD ${item.od} mm, thickness ${item.thickness} mm, width ${item.width} mm`,
      qty: 1,
    });
  });

  if (model.body.closure?.enabled) {
    rows.push({
      tag: model.body.closure.tag,
      family: familyLabel('body'),
      type: 'Closure',
      description: `${equipmentTypeLabel(model.body.closure.type)} closure`,
      qty: 1,
    });
  }

  model.nozzles?.filter((item) => item.enabled).forEach((item) => {
    const fittingType = item.fitting?.type && item.fitting.type !== 'none'
      ? `, fitting ${equipmentTypeLabel(item.fitting.type)}`
      : '';
    rows.push({
      tag: item.tag,
      family: familyLabel('nozzle'),
      type: equipmentTypeLabel(item.type),
      description: `${locationLabel(item.location.mode)} location, neck OD ${item.neck.od} mm, projection ${item.neck.projection} mm${fittingType}`,
      qty: 1,
    });
    if (item.reinforcementPad?.enabled) {
      rows.push({
        tag: `RP-${item.tag}`,
        family: familyLabel('nozzle'),
        type: 'Reinforcement Pad',
        description: `Pad OD ${item.reinforcementPad.od} mm, thickness ${item.reinforcementPad.thickness} mm`,
        qty: 1,
      });
    }
    if (item.blindFlange?.enabled) {
      rows.push({
        tag: `BF-${item.tag}`,
        family: familyLabel('nozzle'),
        type: 'Blind Flange',
        description: `Blind flange for ${item.tag}`,
        qty: 1,
      });
    }
  });

  model.supports?.forEach((item, index) => {
    if (index < 2) {
      rows.push({
        tag: item.tag,
        family: familyLabel('support'),
        type: equipmentTypeLabel(item.type),
        description: `Width ${item.width} mm, height ${item.height} mm, spacing ${item.spacing} mm`,
        qty: 1,
      });
    }
  });

  model.externalAttachments?.filter((item) => item.enabled).forEach((item) => {
    rows.push({
      tag: item.tag,
      family: familyLabel('external'),
      type: equipmentTypeLabel(item.type),
      description: equipmentTypeLabel(item.type),
      qty: 1,
    });
  });

  model.internalAttachments?.filter((item) => item.enabled).forEach((item) => {
    rows.push({
      tag: item.tag,
      family: familyLabel('internal'),
      type: equipmentTypeLabel(item.type),
      description: equipmentTypeLabel(item.type),
      qty: 1,
    });
  });

  model.removableInternals?.filter((item) => item.enabled).forEach((item) => {
    rows.push({
      tag: item.tag,
      family: familyLabel('removable'),
      type: equipmentTypeLabel(item.type),
      description: equipmentTypeLabel(item.type),
      qty: 1,
    });
  });

  return rows;
}
