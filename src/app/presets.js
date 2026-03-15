function stdNozzle(overrides = {}) {
  return {
    tag: 'N1',
    enabled: true,
    type: 'flangedNozzle',
    location: { mode: 'radial', sectionIndex: 0, offset: 0, angle: 0 },
    neck: { od: 300, thickness: 10, projection: 420 },
    flange: { enabled: true, od: 495, thickness: 18, boltCount: 8 },
    blindFlange: { enabled: false, od: 495, thickness: 18 },
    gasket: { enabled: false, outerDiameter: 450, innerDiameter: 305, thickness: 3 },
    studBolt: { enabled: false, boltCircleDiameter: 430, boltDiameter: 20, boltCount: 8, boltLength: 52 },
    reinforcementPad: { enabled: true, od: 420, thickness: 10 },
    fitting: { type: 'none' },
    ...overrides,
    location: { mode: 'radial', sectionIndex: 0, offset: 0, angle: 0, ...(overrides.location || {}) },
    neck: { od: 300, thickness: 10, projection: 420, ...(overrides.neck || {}) },
    flange: { enabled: true, od: 495, thickness: 18, boltCount: 8, ...(overrides.flange || {}) },
    blindFlange: { enabled: false, od: 495, thickness: 18, ...(overrides.blindFlange || {}) },
    gasket: { enabled: false, outerDiameter: 450, innerDiameter: 305, thickness: 3, ...(overrides.gasket || {}) },
    studBolt: { enabled: false, boltCircleDiameter: 430, boltDiameter: 20, boltCount: 8, boltLength: 52, ...(overrides.studBolt || {}) },
    reinforcementPad: { enabled: true, od: 420, thickness: 10, ...(overrides.reinforcementPad || {}) },
    fitting: { type: 'none', ...(overrides.fitting || {}) },
  };
}

function defaultExternalAttachments() {
  return [
    { tag: 'NP-01', type: 'namePlate', enabled: true },
    { tag: 'EB-01', type: 'earthingBoss', enabled: true },
    { tag: 'EL-01', type: 'liftingLug', enabled: false },
    { tag: 'TL-01', type: 'tailingLug', enabled: false },
    { tag: 'CL-01', type: 'clips', enabled: false },
  ];
}

function defaultInternalAttachments() {
  return [
    { tag: 'TS-01', type: 'tubeSheet', enabled: false },
    { tag: 'BI-01', type: 'baffleInlet', enabled: false },
    { tag: 'WP-01', type: 'wearPlate', enabled: false },
    { tag: 'WR-01', type: 'weir', enabled: false },
    { tag: 'VB-01', type: 'vortexBreaker', enabled: false },
    { tag: 'DP-01', type: 'dipPipe', enabled: false },
    { tag: 'IR-01', type: 'ring', enabled: false },
    { tag: 'IC-01', type: 'clips', enabled: false },
  ];
}

function defaultRemovableInternals() {
  return [
    { tag: 'ID-01', type: 'inletDistributor', enabled: false },
    { tag: 'ME-01', type: 'mistEliminator', enabled: false },
    { tag: 'SC-01', type: 'schoepentoeter', enabled: false },
    { tag: 'TR-01', type: 'trays', enabled: false },
    { tag: 'SJ-01', type: 'sandJetting', enabled: false },
  ];
}

export function createStandardVesselPreset() {
  return {
    meta: { name: 'PV-001', equipmentType: 'standardVessel' },
    body: {
      orientation: 'horizontal',
      shellSections: [
        { tag: 'SH-01', type: 'cylindrical', odStart: 2200, odEnd: 2200, thickness: 16, length: 6500 },
      ],
      heads: {
        front: { tag: 'HD-01', enabled: true, type: 'ellipsoidal', od: 2200, thickness: 16 },
        rear: { tag: 'HD-02', enabled: true, type: 'ellipsoidal', od: 2200, thickness: 16 },
      },
      bodyFlanges: [
        {
          tag: 'BF-01',
          enabled: false,
          location: 'front-end',
          od: 2480,
          thickness: 26,
          width: 34,
          gasket: { enabled: true, outerDiameter: 2350, innerDiameter: 2200, thickness: 4 },
          studBolt: { enabled: true, boltCircleDiameter: 2360, boltDiameter: 24, boltCount: 20, boltLength: 72 },
        },
      ],
      closure: { tag: 'CL-01', enabled: false, type: 'flat', thickness: 16 },
    },
    nozzles: [
      { ...stdNozzle(), tag: 'N1', type: 'manhole', neck: { od: 520, thickness: 12, projection: 240 }, flange: { enabled: true, od: 760, thickness: 22, boltCount: 16 }, location: { mode: 'radial', sectionIndex: 0, offset: -900, angle: 0 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 } },
      { ...stdNozzle({ tag: 'N2', neck: { od: 250, thickness: 10, projection: 220 }, flange: { enabled: true, od: 420, thickness: 18, boltCount: 8 }, location: { mode: 'radial', sectionIndex: 0, offset: -80, angle: 0 }, reinforcementPad: { enabled: true, od: 390, thickness: 10 } }) },
      { ...stdNozzle({ tag: 'N3', neck: { od: 180, thickness: 8, projection: 200 }, flange: { enabled: true, od: 320, thickness: 16, boltCount: 8 }, location: { mode: 'radial', sectionIndex: 0, offset: 780, angle: 0 }, reinforcementPad: { enabled: true, od: 300, thickness: 8 } }) },
      { ...stdNozzle({ tag: 'N4', neck: { od: 120, thickness: 8, projection: 180 }, flange: { enabled: true, od: 240, thickness: 14, boltCount: 4 }, location: { mode: 'radial', sectionIndex: 0, offset: 1450, angle: 0 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 } }) },
      { ...stdNozzle({ tag: 'N5', neck: { od: 90, thickness: 8, projection: 160 }, flange: { enabled: true, od: 190, thickness: 14, boltCount: 4 }, location: { mode: 'radial', sectionIndex: 0, offset: -1600, angle: 0 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 } }) },
    ],
    supports: [
      { tag: 'S1', type: 'saddle', width: 760, height: 980, spacing: 3600 },
      { tag: 'S2', type: 'saddle', width: 760, height: 980, spacing: 3600 },
    ],
    externalAttachments: [
      { tag: 'NP-01', type: 'namePlate', enabled: true },
      { tag: 'EB-01', type: 'earthingBoss', enabled: true },
      { tag: 'EL-01', type: 'liftingLug', enabled: true },
      { tag: 'TL-01', type: 'tailingLug', enabled: false },
      { tag: 'CL-01', type: 'clips', enabled: true },
    ],
    internalAttachments: defaultInternalAttachments(),
    removableInternals: defaultRemovableInternals(),
  };
}

export function createPigLauncherPreset() {
  return {
    meta: { name: 'PL-001', equipmentType: 'pigLauncher' },
    body: {
      orientation: 'horizontal',
      shellSections: [
        { tag: 'SH-01', type: 'cylindrical', odStart: 1200, odEnd: 1200, thickness: 18, length: 2800 },
        { tag: 'SH-02', type: 'tapered', odStart: 1200, odEnd: 700, thickness: 18, length: 900 },
        { tag: 'SH-03', type: 'cylindrical', odStart: 700, odEnd: 700, thickness: 18, length: 1400 },
      ],
      heads: {
        front: { tag: 'HD-01', enabled: false, type: 'flat', od: 1200, thickness: 18 },
        rear: { tag: 'HD-02', enabled: true, type: 'ellipsoidal', od: 700, thickness: 18 },
      },
      bodyFlanges: [
        {
          tag: 'BF-01',
          enabled: true,
          sectionInterface: 0,
          od: 1230,
          thickness: 24,
          width: 26,
          gasket: { enabled: true, outerDiameter: 1160, innerDiameter: 1040, thickness: 3 },
          studBolt: { enabled: true, boltCircleDiameter: 1160, boltDiameter: 20, boltCount: 16, boltLength: 58 },
        },
        {
          tag: 'BF-02',
          enabled: true,
          sectionInterface: 1,
          od: 730,
          thickness: 22,
          width: 22,
          gasket: { enabled: true, outerDiameter: 680, innerDiameter: 600, thickness: 3 },
          studBolt: { enabled: true, boltCircleDiameter: 680, boltDiameter: 18, boltCount: 12, boltLength: 52 },
        },
      ],
      closure: { tag: 'QOC-01', enabled: true, type: 'flat', thickness: 18 },
    },
    nozzles: [
      { tag: 'N1', enabled: true, type: 'flangedNozzle', location: { mode: 'radial', sectionIndex: 0, offset: -200, angle: 90 }, neck: { od: 100, thickness: 10, projection: 220 }, flange: { enabled: true, od: 165, thickness: 16, boltCount: 8 }, blindFlange: { enabled: false, od: 165, thickness: 16 }, gasket: { enabled: false, outerDiameter: 150, innerDiameter: 102, thickness: 3 }, studBolt: { enabled: false, boltCircleDiameter: 140, boltDiameter: 16, boltCount: 8, boltLength: 42 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 }, fitting: { type: 'vent' } },
      { tag: 'N2', enabled: true, type: 'flangedNozzle', location: { mode: 'radial', sectionIndex: 0, offset: 950, angle: -90 }, neck: { od: 80, thickness: 10, projection: 200 }, flange: { enabled: true, od: 132, thickness: 16, boltCount: 8 }, blindFlange: { enabled: false, od: 132, thickness: 16 }, gasket: { enabled: false, outerDiameter: 118, innerDiameter: 82, thickness: 3 }, studBolt: { enabled: false, boltCircleDiameter: 112, boltDiameter: 16, boltCount: 8, boltLength: 42 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 }, fitting: { type: 'kicker' } },
      { tag: 'N3', enabled: true, type: 'flangedNozzle', location: { mode: 'axial-rear', sectionIndex: 2, offset: 0, angle: 0 }, neck: { od: 480, thickness: 12, projection: 450 }, flange: { enabled: true, od: 165, thickness: 16, boltCount: 8 }, blindFlange: { enabled: false, od: 165, thickness: 16 }, gasket: { enabled: false, outerDiameter: 150, innerDiameter: 102, thickness: 3 }, studBolt: { enabled: false, boltCircleDiameter: 140, boltDiameter: 16, boltCount: 8, boltLength: 42 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 }, fitting: { type: 'outlet' } },
    ],
    supports: [
      { tag: 'S1', type: 'saddle', width: 260, height: 460, spacing: 2200 },
      { tag: 'S2', type: 'saddle', width: 260, height: 460, spacing: 2200 },
    ],
    externalAttachments: defaultExternalAttachments(),
    internalAttachments: defaultInternalAttachments(),
    removableInternals: defaultRemovableInternals(),
  };
}

export function createReboilerPreset() {
  return {
    meta: { name: 'REB-001', equipmentType: 'reboiler' },
    body: {
      orientation: 'horizontal',
      shellSections: [
        { tag: 'SH-01', type: 'cylindrical', odStart: 1100, odEnd: 1100, thickness: 16, length: 650 },
        { tag: 'SH-02', type: 'cylindrical', odStart: 1800, odEnd: 1800, thickness: 16, length: 5200 },
      ],
      heads: {
        front: { tag: 'HD-01', enabled: true, type: 'flat', od: 1100, thickness: 16 },
        rear: { tag: 'HD-02', enabled: true, type: 'ellipsoidal', od: 1800, thickness: 16 },
      },
      bodyFlanges: [
        {
          tag: 'BF-01',
          enabled: true,
          sectionInterface: 0,
          od: 1830,
          thickness: 28,
          width: 28,
          gasket: { enabled: true, outerDiameter: 1710, innerDiameter: 1600, thickness: 4 },
          studBolt: { enabled: true, boltCircleDiameter: 1710, boltDiameter: 24, boltCount: 20, boltLength: 70 },
        },
        {
          tag: 'BF-02',
          enabled: true,
          sectionInterface: 0,
          od: 1130,
          thickness: 28,
          width: 28,
          gasket: { enabled: true, outerDiameter: 1030, innerDiameter: 920, thickness: 4 },
          studBolt: { enabled: true, boltCircleDiameter: 1030, boltDiameter: 22, boltCount: 16, boltLength: 66 },
        },
        {
          tag: 'BF-03',
          enabled: true,
          location: 'front-end',
          od: 1130,
          thickness: 28,
          width: 28,
          gasket: { enabled: true, outerDiameter: 1030, innerDiameter: 920, thickness: 4 },
          studBolt: { enabled: true, boltCircleDiameter: 1030, boltDiameter: 22, boltCount: 16, boltLength: 66 },
        },
      ],
      closure: { tag: 'CL-01', enabled: false, type: 'flat', thickness: 16 },
    },
    nozzles: [
      { tag: 'N1', enabled: true, type: 'flangedNozzle', location: { mode: 'radial', sectionIndex: 1, offset: -900, angle: 0 }, neck: { od: 250, thickness: 10, projection: 350 }, flange: { enabled: true, od: 165, thickness: 16, boltCount: 8 }, blindFlange: { enabled: false, od: 165, thickness: 16 }, gasket: { enabled: false, outerDiameter: 150, innerDiameter: 102, thickness: 3 }, studBolt: { enabled: false, boltCircleDiameter: 140, boltDiameter: 16, boltCount: 8, boltLength: 42 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 }, fitting: { type: 'shell-side' } },
      { tag: 'N2', enabled: true, type: 'flangedNozzle', location: { mode: 'radial', sectionIndex: 1, offset: 850, angle: 180 }, neck: { od: 190, thickness: 10, projection: 290 }, flange: { enabled: true, od: 165, thickness: 16, boltCount: 8 }, blindFlange: { enabled: false, od: 165, thickness: 16 }, gasket: { enabled: false, outerDiameter: 150, innerDiameter: 102, thickness: 3 }, studBolt: { enabled: false, boltCircleDiameter: 140, boltDiameter: 16, boltCount: 8, boltLength: 42 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 }, fitting: { type: 'shell-side' } },
      { tag: 'N3', enabled: true, type: 'flangedNozzle', location: { mode: 'radial', sectionIndex: 0, offset: 0, angle: 90 }, neck: { od: 180, thickness: 8, projection: 260 }, flange: { enabled: true, od: 165, thickness: 16, boltCount: 8 }, blindFlange: { enabled: false, od: 165, thickness: 16 }, gasket: { enabled: false, outerDiameter: 150, innerDiameter: 102, thickness: 3 }, studBolt: { enabled: false, boltCircleDiameter: 140, boltDiameter: 16, boltCount: 8, boltLength: 42 }, reinforcementPad: { enabled: false, od: 0, thickness: 0 }, fitting: { type: 'channel-side' } },
    ],
    supports: [
      { tag: 'S1', type: 'saddle', width: 300, height: 540, spacing: 3000 },
      { tag: 'S2', type: 'saddle', width: 300, height: 540, spacing: 3000 },
    ],
    externalAttachments: defaultExternalAttachments(),
    internalAttachments: [
      { tag: 'TS-01', type: 'tubeSheet', enabled: true },
      { tag: 'BI-01', type: 'baffleInlet', enabled: false },
      { tag: 'WP-01', type: 'wearPlate', enabled: false },
      { tag: 'WR-01', type: 'weir', enabled: false },
      { tag: 'VB-01', type: 'vortexBreaker', enabled: false },
      { tag: 'DP-01', type: 'dipPipe', enabled: false },
      { tag: 'IR-01', type: 'ring', enabled: false },
      { tag: 'IC-01', type: 'clips', enabled: false },
    ],
    removableInternals: defaultRemovableInternals(),
  };
}

export function createPresetModel(type) {
  if (type === 'pigLauncher') return createPigLauncherPreset();
  if (type === 'reboiler') return createReboilerPreset();
  return createStandardVesselPreset();
}
