function boolValue(el) { return Boolean(el.checked); }
function numValue(el) { return Number(el.value); }

export function getDomRefs() {
  const ids = [
    'modelName','equipmentType','displayMode','segments','materialDensity','corrosionAllowance','weldEnabled','weldType','weldSizeFactor',
    'bodyOrientation','shellSectionType','shellODStart','shellODEnd','shellThickness','shellLength','frontHeadType','rearHeadType',
    'bodyFlangeTag','bodyFlangeLocation','bodyFlangeEnabled','bodyFlangeOD','bodyFlangeThickness','bodyFlangeWidth','bodyGasketEnabled','bodyGasketOD','bodyGasketID','bodyGasketThickness','bodyStudEnabled','bodyStudBCD','bodyStudDiameter','bodyStudCount','bodyStudLength',
    'pigBodyWrap','reboilerBodyWrap','pigMinorOD','pigReducerLength','pigNeckLength','closureType','channelOD','channelLength','tubeBundleOD',
    'nozzleTag','nozzleType','nozzleEnabled','nozzleLocationMode','nozzleOD','nozzleThickness','nozzleProjection','nozzleOffset','nozzleAngle','nozzleFlangeEnabled','nozzleFlangeOD','nozzleFlangeThickness','nozzleFlangeBoltCount','nozzlePadEnabled','nozzlePadOD','nozzlePadThickness','nozzleBlindEnabled','nozzleBlindOD','nozzleBlindThickness','nozzleGasketEnabled','nozzleGasketOD','nozzleGasketID','nozzleGasketThickness','nozzleStudEnabled','nozzleStudBCD','nozzleStudDiameter','nozzleStudCount','nozzleStudLength',
    'supportType','supportSpacing','supportWidth','supportHeight',
    'extLiftingLug','extTailingLug','extNamePlate','extEarthingBoss','extClips',
    'intTubeSheet','intBaffleInlet','intWearPlate','intWeir','intVortexBreaker','intDipPipe','intRing','intClips',
    'remInletDistributor','remMistEliminator','remSchoepentoeter','remTrays','remSandJetting',
    'summary','bomPreview','viewerTitle','viewerSubTitle',
  ];
  const dom = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  dom.fitViewBtn = document.getElementById('fitViewBtn');
  dom.resetBtn = document.getElementById('resetBtn');
  dom.saveJsonBtn = document.getElementById('saveJsonBtn');
  dom.exportBomBtn = document.getElementById('exportBomBtn');
  dom.exportStlBtn = document.getElementById('exportStlBtn');
  dom.exportGlbBtn = document.getElementById('exportGlbBtn');
  dom.viewButtons = document.querySelectorAll('.view-btn');
  return dom;
}

function eventName(el) { return el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input'; }

function bind(el, fn) { if (!el) return; el.addEventListener(eventName(el), fn); }

function setAttachmentToggle(arr, type, enabled) {
  const item = arr.find((entry) => entry.type === type || entry.tag?.toLowerCase().includes(type.toLowerCase()));
  if (item) item.enabled = enabled;
}

function ensurePrimaryBodyFlange(model) {
  if (!Array.isArray(model.body.bodyFlanges)) model.body.bodyFlanges = [];
  if (!model.body.bodyFlanges[0]) {
    const shell = model.body.shellSections[0];
    model.body.bodyFlanges[0] = {
      tag: 'BF-01',
      enabled: true,
      location: 'front-end',
      od: Math.round((shell?.odStart || 1000) * 1.12),
      thickness: Math.max(Math.round((shell?.thickness || 12) * 1.6), 20),
      width: Math.max(Math.round((shell?.thickness || 12) * 2), 28),
      gasket: {
        enabled: true,
        outerDiameter: Math.round((shell?.odStart || 1000) * 1.04),
        innerDiameter: shell?.odStart || 1000,
        thickness: 3,
      },
      studBolt: {
        enabled: true,
        boltCircleDiameter: Math.round((shell?.odStart || 1000) * 1.05),
        boltDiameter: 24,
        boltCount: 16,
        boltLength: 70,
      },
    };
  }
  return model.body.bodyFlanges[0];
}

function bodyFlangeLocationValue(flange) {
  if (typeof flange?.sectionInterface === 'number') return `interface-${flange.sectionInterface + 1}`;
  return flange?.location || 'front-end';
}

function applyBodyFlangeLocation(flange, value) {
  delete flange.sectionInterface;
  delete flange.location;
  if (value.startsWith('interface-')) {
    flange.sectionInterface = Math.max(Number(value.split('-')[1] || 1) - 1, 0);
  } else {
    flange.location = value;
  }
}

export function bindForm({ dom, store }) {
  bind(dom.modelName, () => store.updatePath('model.meta.name', dom.modelName.value));
  bind(dom.equipmentType, () => store.setEquipmentType(dom.equipmentType.value));
  bind(dom.displayMode, () => store.updatePath('view.displayMode', dom.displayMode.value));
  bind(dom.segments, () => store.updatePath('view.segments', numValue(dom.segments)));
  bind(dom.materialDensity, () => store.updatePath('material.density', numValue(dom.materialDensity)));
  bind(dom.corrosionAllowance, () => store.updatePath('material.corrosionAllowance', numValue(dom.corrosionAllowance)));
  bind(dom.weldEnabled, () => store.updatePath('weld.enabled', boolValue(dom.weldEnabled)));
  bind(dom.weldType, () => store.updatePath('weld.type', dom.weldType.value));
  bind(dom.weldSizeFactor, () => store.updatePath('weld.sizeFactor', numValue(dom.weldSizeFactor)));

  bind(dom.bodyOrientation, () => store.updatePath('model.body.orientation', dom.bodyOrientation.value));
  bind(dom.shellSectionType, () => store.updatePath('model.body.shellSections[0].type', dom.shellSectionType.value));
  bind(dom.shellODStart, () => store.updatePath('model.body.shellSections[0].odStart', numValue(dom.shellODStart)));
  bind(dom.shellODEnd, () => store.updatePath('model.body.shellSections[0].odEnd', numValue(dom.shellODEnd)));
  bind(dom.shellThickness, () => {
    store.updatePath('model.body.shellSections[0].thickness', numValue(dom.shellThickness));
    store.updatePath('model.body.heads.front.thickness', numValue(dom.shellThickness));
    store.updatePath('model.body.heads.rear.thickness', numValue(dom.shellThickness));
  });
  bind(dom.shellLength, () => store.updatePath('model.body.shellSections[0].length', numValue(dom.shellLength)));
  bind(dom.frontHeadType, () => store.updatePath('model.body.heads.front.type', dom.frontHeadType.value));
  bind(dom.rearHeadType, () => store.updatePath('model.body.heads.rear.type', dom.rearHeadType.value));

  bind(dom.bodyFlangeLocation, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    applyBodyFlangeLocation(flange, dom.bodyFlangeLocation.value);
  }));
  bind(dom.bodyFlangeEnabled, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.enabled = boolValue(dom.bodyFlangeEnabled);
  }));
  bind(dom.bodyFlangeOD, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.od = numValue(dom.bodyFlangeOD);
  }));
  bind(dom.bodyFlangeThickness, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.thickness = numValue(dom.bodyFlangeThickness);
  }));
  bind(dom.bodyFlangeWidth, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.width = numValue(dom.bodyFlangeWidth);
  }));
  bind(dom.bodyGasketEnabled, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.gasket.enabled = boolValue(dom.bodyGasketEnabled);
  }));
  bind(dom.bodyGasketOD, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.gasket.outerDiameter = numValue(dom.bodyGasketOD);
  }));
  bind(dom.bodyGasketID, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.gasket.innerDiameter = numValue(dom.bodyGasketID);
  }));
  bind(dom.bodyGasketThickness, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.gasket.thickness = numValue(dom.bodyGasketThickness);
  }));
  bind(dom.bodyStudEnabled, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.studBolt.enabled = boolValue(dom.bodyStudEnabled);
  }));
  bind(dom.bodyStudBCD, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.studBolt.boltCircleDiameter = numValue(dom.bodyStudBCD);
  }));
  bind(dom.bodyStudDiameter, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.studBolt.boltDiameter = numValue(dom.bodyStudDiameter);
  }));
  bind(dom.bodyStudCount, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.studBolt.boltCount = numValue(dom.bodyStudCount);
  }));
  bind(dom.bodyStudLength, () => store.setState((draft) => {
    const flange = ensurePrimaryBodyFlange(draft.model);
    flange.studBolt.boltLength = numValue(dom.bodyStudLength);
  }));

  bind(dom.pigMinorOD, () => {
    store.updatePath('model.body.shellSections[1].odEnd', numValue(dom.pigMinorOD));
    store.updatePath('model.body.shellSections[2].odStart', numValue(dom.pigMinorOD));
    store.updatePath('model.body.shellSections[2].odEnd', numValue(dom.pigMinorOD));
    store.updatePath('model.body.heads.rear.od', numValue(dom.pigMinorOD));
  });
  bind(dom.pigReducerLength, () => store.updatePath('model.body.shellSections[1].length', numValue(dom.pigReducerLength)));
  bind(dom.pigNeckLength, () => store.updatePath('model.body.shellSections[2].length', numValue(dom.pigNeckLength)));
  bind(dom.closureType, () => store.updatePath('model.body.closure.type', dom.closureType.value));

  bind(dom.channelOD, () => {
    store.updatePath('model.body.shellSections[0].odStart', numValue(dom.channelOD));
    store.updatePath('model.body.shellSections[0].odEnd', numValue(dom.channelOD));
    store.updatePath('model.body.heads.front.od', numValue(dom.channelOD));
  });
  bind(dom.channelLength, () => store.updatePath('model.body.shellSections[0].length', numValue(dom.channelLength)));
  bind(dom.tubeBundleOD, () => store.updatePath('model.internalAttachments[0].bundleOD', numValue(dom.tubeBundleOD)));

  bind(dom.nozzleType, () => store.updatePath('model.nozzles[0].type', dom.nozzleType.value));
  bind(dom.nozzleEnabled, () => store.updatePath('model.nozzles[0].enabled', boolValue(dom.nozzleEnabled)));
  bind(dom.nozzleLocationMode, () => store.updatePath('model.nozzles[0].location.mode', dom.nozzleLocationMode.value));
  bind(dom.nozzleOD, () => store.updatePath('model.nozzles[0].neck.od', numValue(dom.nozzleOD)));
  bind(dom.nozzleThickness, () => store.updatePath('model.nozzles[0].neck.thickness', numValue(dom.nozzleThickness)));
  bind(dom.nozzleProjection, () => store.updatePath('model.nozzles[0].neck.projection', numValue(dom.nozzleProjection)));
  bind(dom.nozzleOffset, () => store.updatePath('model.nozzles[0].location.offset', numValue(dom.nozzleOffset)));
  bind(dom.nozzleAngle, () => store.updatePath('model.nozzles[0].location.angle', numValue(dom.nozzleAngle)));
  bind(dom.nozzleFlangeEnabled, () => store.updatePath('model.nozzles[0].flange.enabled', boolValue(dom.nozzleFlangeEnabled)));
  bind(dom.nozzleFlangeOD, () => store.updatePath('model.nozzles[0].flange.od', numValue(dom.nozzleFlangeOD)));
  bind(dom.nozzleFlangeThickness, () => store.updatePath('model.nozzles[0].flange.thickness', numValue(dom.nozzleFlangeThickness)));
  bind(dom.nozzleFlangeBoltCount, () => store.updatePath('model.nozzles[0].flange.boltCount', numValue(dom.nozzleFlangeBoltCount)));
  bind(dom.nozzlePadEnabled, () => store.updatePath('model.nozzles[0].reinforcementPad.enabled', boolValue(dom.nozzlePadEnabled)));
  bind(dom.nozzlePadOD, () => store.updatePath('model.nozzles[0].reinforcementPad.od', numValue(dom.nozzlePadOD)));
  bind(dom.nozzlePadThickness, () => store.updatePath('model.nozzles[0].reinforcementPad.thickness', numValue(dom.nozzlePadThickness)));
  bind(dom.nozzleBlindEnabled, () => store.updatePath('model.nozzles[0].blindFlange.enabled', boolValue(dom.nozzleBlindEnabled)));
  bind(dom.nozzleBlindOD, () => store.updatePath('model.nozzles[0].blindFlange.od', numValue(dom.nozzleBlindOD)));
  bind(dom.nozzleBlindThickness, () => store.updatePath('model.nozzles[0].blindFlange.thickness', numValue(dom.nozzleBlindThickness)));
  bind(dom.nozzleGasketEnabled, () => store.updatePath('model.nozzles[0].gasket.enabled', boolValue(dom.nozzleGasketEnabled)));
  bind(dom.nozzleGasketOD, () => store.updatePath('model.nozzles[0].gasket.outerDiameter', numValue(dom.nozzleGasketOD)));
  bind(dom.nozzleGasketID, () => store.updatePath('model.nozzles[0].gasket.innerDiameter', numValue(dom.nozzleGasketID)));
  bind(dom.nozzleGasketThickness, () => store.updatePath('model.nozzles[0].gasket.thickness', numValue(dom.nozzleGasketThickness)));
  bind(dom.nozzleStudEnabled, () => store.updatePath('model.nozzles[0].studBolt.enabled', boolValue(dom.nozzleStudEnabled)));
  bind(dom.nozzleStudBCD, () => store.updatePath('model.nozzles[0].studBolt.boltCircleDiameter', numValue(dom.nozzleStudBCD)));
  bind(dom.nozzleStudDiameter, () => store.updatePath('model.nozzles[0].studBolt.boltDiameter', numValue(dom.nozzleStudDiameter)));
  bind(dom.nozzleStudCount, () => store.updatePath('model.nozzles[0].studBolt.boltCount', numValue(dom.nozzleStudCount)));
  bind(dom.nozzleStudLength, () => store.updatePath('model.nozzles[0].studBolt.boltLength', numValue(dom.nozzleStudLength)));

  bind(dom.supportType, () => store.updatePath('model.supports[0].type', dom.supportType.value));
  bind(dom.supportSpacing, () => { store.updatePath('model.supports[0].spacing', numValue(dom.supportSpacing)); store.updatePath('model.supports[1].spacing', numValue(dom.supportSpacing)); });
  bind(dom.supportWidth, () => { store.updatePath('model.supports[0].width', numValue(dom.supportWidth)); store.updatePath('model.supports[1].width', numValue(dom.supportWidth)); });
  bind(dom.supportHeight, () => { store.updatePath('model.supports[0].height', numValue(dom.supportHeight)); store.updatePath('model.supports[1].height', numValue(dom.supportHeight)); });

  bind(dom.extLiftingLug, () => store.setState((draft) => setAttachmentToggle(draft.model.externalAttachments, 'liftingLug', boolValue(dom.extLiftingLug))));
  bind(dom.extTailingLug, () => store.setState((draft) => setAttachmentToggle(draft.model.externalAttachments, 'tailingLug', boolValue(dom.extTailingLug))));
  bind(dom.extNamePlate, () => store.setState((draft) => setAttachmentToggle(draft.model.externalAttachments, 'namePlate', boolValue(dom.extNamePlate))));
  bind(dom.extEarthingBoss, () => store.setState((draft) => setAttachmentToggle(draft.model.externalAttachments, 'earthingBoss', boolValue(dom.extEarthingBoss))));
  bind(dom.extClips, () => store.setState((draft) => setAttachmentToggle(draft.model.externalAttachments, 'clips', boolValue(dom.extClips))));

  bind(dom.intTubeSheet, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'tubeSheet', boolValue(dom.intTubeSheet))));
  bind(dom.intBaffleInlet, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'baffleInlet', boolValue(dom.intBaffleInlet))));
  bind(dom.intWearPlate, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'wearPlate', boolValue(dom.intWearPlate))));
  bind(dom.intWeir, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'weir', boolValue(dom.intWeir))));
  bind(dom.intVortexBreaker, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'vortexBreaker', boolValue(dom.intVortexBreaker))));
  bind(dom.intDipPipe, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'dipPipe', boolValue(dom.intDipPipe))));
  bind(dom.intRing, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'ring', boolValue(dom.intRing))));
  bind(dom.intClips, () => store.setState((draft) => setAttachmentToggle(draft.model.internalAttachments, 'clips', boolValue(dom.intClips))));

  bind(dom.remInletDistributor, () => store.setState((draft) => setAttachmentToggle(draft.model.removableInternals, 'inletDistributor', boolValue(dom.remInletDistributor))));
  bind(dom.remMistEliminator, () => store.setState((draft) => setAttachmentToggle(draft.model.removableInternals, 'mistEliminator', boolValue(dom.remMistEliminator))));
  bind(dom.remSchoepentoeter, () => store.setState((draft) => setAttachmentToggle(draft.model.removableInternals, 'schoepentoeter', boolValue(dom.remSchoepentoeter))));
  bind(dom.remTrays, () => store.setState((draft) => setAttachmentToggle(draft.model.removableInternals, 'trays', boolValue(dom.remTrays))));
  bind(dom.remSandJetting, () => store.setState((draft) => setAttachmentToggle(draft.model.removableInternals, 'sandJetting', boolValue(dom.remSandJetting))));
}

function findAttachment(arr, type) { return arr.find((item) => item.type === type); }

export function renderForm({ dom, state }) {
  const model = state.model;
  const main = model.body.shellSections[0];
  const nozzle = model.nozzles[0] || {};
  const support = model.supports[0] || {};

  dom.modelName.value = model.meta.name;
  dom.equipmentType.value = model.meta.equipmentType;
  dom.displayMode.value = state.view.displayMode;
  dom.segments.value = state.view.segments;
  dom.materialDensity.value = state.material.density;
  dom.corrosionAllowance.value = state.material.corrosionAllowance;
  dom.weldEnabled.checked = state.weld.enabled;
  dom.weldType.value = state.weld.type;
  dom.weldSizeFactor.value = state.weld.sizeFactor;

  dom.bodyOrientation.value = model.body.orientation;
  dom.shellSectionType.value = main.type;
  dom.shellODStart.value = main.odStart;
  dom.shellODEnd.value = main.odEnd;
  dom.shellThickness.value = main.thickness;
  dom.shellLength.value = main.length;
  dom.frontHeadType.value = model.body.heads.front.type;
  dom.rearHeadType.value = model.body.heads.rear.type;

  const bodyFlange = ensurePrimaryBodyFlange(model);
  dom.bodyFlangeTag.value = bodyFlange.tag || 'BF-01';
  dom.bodyFlangeLocation.value = bodyFlangeLocationValue(bodyFlange);
  dom.bodyFlangeEnabled.checked = Boolean(bodyFlange.enabled);
  dom.bodyFlangeOD.value = bodyFlange.od || 0;
  dom.bodyFlangeThickness.value = bodyFlange.thickness || 0;
  dom.bodyFlangeWidth.value = bodyFlange.width || 0;
  dom.bodyGasketEnabled.checked = Boolean(bodyFlange.gasket?.enabled);
  dom.bodyGasketOD.value = bodyFlange.gasket?.outerDiameter || 0;
  dom.bodyGasketID.value = bodyFlange.gasket?.innerDiameter || 0;
  dom.bodyGasketThickness.value = bodyFlange.gasket?.thickness || 0;
  dom.bodyStudEnabled.checked = Boolean(bodyFlange.studBolt?.enabled);
  dom.bodyStudBCD.value = bodyFlange.studBolt?.boltCircleDiameter || 0;
  dom.bodyStudDiameter.value = bodyFlange.studBolt?.boltDiameter || 0;
  dom.bodyStudCount.value = bodyFlange.studBolt?.boltCount || 0;
  dom.bodyStudLength.value = bodyFlange.studBolt?.boltLength || 0;

  dom.pigBodyWrap.classList.toggle('hidden', model.meta.equipmentType !== 'pigLauncher');
  dom.reboilerBodyWrap.classList.toggle('hidden', model.meta.equipmentType !== 'reboiler');

  if (model.meta.equipmentType === 'pigLauncher') {
    dom.pigMinorOD.value = model.body.shellSections[2].odStart;
    dom.pigReducerLength.value = model.body.shellSections[1].length;
    dom.pigNeckLength.value = model.body.shellSections[2].length;
    dom.closureType.value = model.body.closure.type;
  }
  if (model.meta.equipmentType === 'reboiler') {
    dom.channelOD.value = model.body.shellSections[0].odStart;
    dom.channelLength.value = model.body.shellSections[0].length;
    dom.tubeBundleOD.value = model.internalAttachments[0]?.bundleOD || 1200;
  }

  dom.nozzleTag.value = nozzle.tag || '';
  dom.nozzleType.value = nozzle.type || 'flangedNozzle';
  dom.nozzleEnabled.checked = Boolean(nozzle.enabled);
  dom.nozzleLocationMode.value = nozzle.location?.mode || 'radial';
  dom.nozzleOD.value = nozzle.neck?.od || 100;
  dom.nozzleThickness.value = nozzle.neck?.thickness || 8;
  dom.nozzleProjection.value = nozzle.neck?.projection || 200;
  dom.nozzleOffset.value = nozzle.location?.offset || 0;
  dom.nozzleAngle.value = nozzle.location?.angle || 0;
  dom.nozzleFlangeEnabled.checked = Boolean(nozzle.flange?.enabled);
  dom.nozzleFlangeOD.value = nozzle.flange?.od || Math.round((nozzle.neck?.od || 100) * 1.65);
  dom.nozzleFlangeThickness.value = nozzle.flange?.thickness || Math.max((nozzle.neck?.thickness || 8) * 1.8, 16);
  dom.nozzleFlangeBoltCount.value = nozzle.flange?.boltCount || (nozzle.type === 'manhole' ? 12 : 8);
  dom.nozzlePadEnabled.checked = Boolean(nozzle.reinforcementPad?.enabled);
  dom.nozzleBlindEnabled.checked = Boolean(nozzle.blindFlange?.enabled);
  dom.nozzlePadOD.value = nozzle.reinforcementPad?.od || Math.round((nozzle.neck?.od || 100) * 1.4);
  dom.nozzlePadThickness.value = nozzle.reinforcementPad?.thickness || (nozzle.neck?.thickness || 8);
  dom.nozzleBlindOD.value = nozzle.blindFlange?.od || Math.round((nozzle.flange?.od || (nozzle.neck?.od || 100) * 1.65));
  dom.nozzleBlindThickness.value = nozzle.blindFlange?.thickness || (nozzle.flange?.thickness || Math.max((nozzle.neck?.thickness || 8) * 1.8, 16));
  dom.nozzleGasketEnabled.checked = Boolean(nozzle.gasket?.enabled);
  dom.nozzleGasketOD.value = nozzle.gasket?.outerDiameter || Math.round((nozzle.flange?.od || (nozzle.neck?.od || 100) * 1.65) * 0.9);
  dom.nozzleGasketID.value = nozzle.gasket?.innerDiameter || Math.round((nozzle.neck?.od || 100) * 1.02);
  dom.nozzleGasketThickness.value = nozzle.gasket?.thickness || 3;
  dom.nozzleStudEnabled.checked = Boolean(nozzle.studBolt?.enabled);
  dom.nozzleStudBCD.value = nozzle.studBolt?.boltCircleDiameter || Math.round((nozzle.flange?.od || (nozzle.neck?.od || 100) * 1.65) * 0.87);
  dom.nozzleStudDiameter.value = nozzle.studBolt?.boltDiameter || Math.max(Math.round((nozzle.neck?.od || 100) * 0.06), 12);
  dom.nozzleStudCount.value = nozzle.studBolt?.boltCount || (nozzle.flange?.boltCount || (nozzle.type === 'manhole' ? 12 : 8));
  dom.nozzleStudLength.value = nozzle.studBolt?.boltLength || Math.max((nozzle.flange?.thickness || 16) + (nozzle.blindFlange?.thickness || 16) + (nozzle.gasket?.thickness || 0) + 12, 42);

  dom.supportType.value = support.type || 'saddle';
  dom.supportSpacing.value = support.spacing || 0;
  dom.supportWidth.value = support.width || 0;
  dom.supportHeight.value = support.height || 0;

  dom.extLiftingLug.checked = Boolean(findAttachment(model.externalAttachments, 'liftingLug')?.enabled);
  dom.extTailingLug.checked = Boolean(findAttachment(model.externalAttachments, 'tailingLug')?.enabled);
  dom.extNamePlate.checked = Boolean(findAttachment(model.externalAttachments, 'namePlate')?.enabled);
  dom.extEarthingBoss.checked = Boolean(findAttachment(model.externalAttachments, 'earthingBoss')?.enabled);
  dom.extClips.checked = Boolean(findAttachment(model.externalAttachments, 'clips')?.enabled);

  dom.intTubeSheet.checked = Boolean(findAttachment(model.internalAttachments, 'tubeSheet')?.enabled);
  dom.intBaffleInlet.checked = Boolean(findAttachment(model.internalAttachments, 'baffleInlet')?.enabled);
  dom.intWearPlate.checked = Boolean(findAttachment(model.internalAttachments, 'wearPlate')?.enabled);
  dom.intWeir.checked = Boolean(findAttachment(model.internalAttachments, 'weir')?.enabled);
  dom.intVortexBreaker.checked = Boolean(findAttachment(model.internalAttachments, 'vortexBreaker')?.enabled);
  dom.intDipPipe.checked = Boolean(findAttachment(model.internalAttachments, 'dipPipe')?.enabled);
  dom.intRing.checked = Boolean(findAttachment(model.internalAttachments, 'ring')?.enabled);
  dom.intClips.checked = Boolean(findAttachment(model.internalAttachments, 'clips')?.enabled);

  dom.remInletDistributor.checked = Boolean(findAttachment(model.removableInternals, 'inletDistributor')?.enabled);
  dom.remMistEliminator.checked = Boolean(findAttachment(model.removableInternals, 'mistEliminator')?.enabled);
  dom.remSchoepentoeter.checked = Boolean(findAttachment(model.removableInternals, 'schoepentoeter')?.enabled);
  dom.remTrays.checked = Boolean(findAttachment(model.removableInternals, 'trays')?.enabled);
  dom.remSandJetting.checked = Boolean(findAttachment(model.removableInternals, 'sandJetting')?.enabled);

  dom.viewerTitle.textContent = model.meta.name;
  dom.viewerSubTitle.textContent = ` — ${model.meta.equipmentType}`;
}
