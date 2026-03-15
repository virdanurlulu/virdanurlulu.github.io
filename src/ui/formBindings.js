import { clamp } from '../utils/math.js';

export function getDomRefs() {
  const ids = [
    'modelName','modelType','equipmentType','equipmentTypeWrap','displayMode','segments','materialDensity','corrosionAllowance',
    'weldPanel','weldEnabled','weldType','weldSizeFactor',
    'pipePanel','pipeOrientation','pipeOuterDiameter','pipeInnerDiameter','pipeThickness','pipeLength','pipeElbowAngle','pipeBendRadius','pipeOutletLength',
    'standardPanel','stdOrientation','stdShellType','stdShellOD','stdShellID','stdThickness','stdShellTopOD','stdShellTopODWrap','stdShellLength','stdTopHeadType','stdBottomHeadType',
    'stdNozzleEnabled','stdNozzleDiameter','stdNozzleThickness','stdNozzleProjection','stdNozzleOffset','stdNozzleAngle','stdSupportType',
    'stdSaddleSpacing','stdSaddleWidth','stdSaddleHeight','stdSaddleSpacingWrap','stdSaddleWidthWrap','stdSaddleHeightWrap',
    'pigLauncherPanel','pigOrientation','pigMajorOD','pigMinorOD','pigThickness','pigMajorLength','pigReducerLength','pigNeckLength',
    'pigClosureType','pigTailType','pigDischargeProjection','pigSaddleSpacing','pigSaddleWidth','pigSaddleHeight',
    'pigVentEnabled','pigVentNozzleDiameter','pigKickerEnabled','pigKickerNozzleDiameter','pigNozzleThickness','pigVentNozzleWrap','pigKickerNozzleWrap',
    'reboilerPanel','rebOrientation','rebShellOD','rebShellID','rebThickness','rebShellLength','rebChannelOD','rebChannelLength',
    'rebRearHeadType','rebFrontHeadType','rebTubeBundleOD','rebNozzleDiameter','rebNozzleProjection','rebSaddleSpacing','rebSaddleWidth','rebSaddleHeight',
    'viewerTitle','viewerSubTitle',
  ];
  const dom = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  dom.summary = document.getElementById('summary');
  dom.fitViewBtn = document.getElementById('fitViewBtn');
  dom.resetBtn = document.getElementById('resetBtn');
  dom.saveJsonBtn = document.getElementById('saveJsonBtn');
  dom.exportStlBtn = document.getElementById('exportStlBtn');
  dom.exportGlbBtn = document.getElementById('exportGlbBtn');
  dom.viewButtons = document.querySelectorAll('.view-btn');
  dom.stdNozzleFields = document.querySelectorAll('.std-nozzle-field');
  return dom;
}

function eventName(el) {
  return el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
}

export function bindForm({ dom, store }) {
  const number = (value) => Number(value);

  const directMap = [
    ['modelName', 'meta.name'],
    ['modelType', 'meta.modelType'],
    ['equipmentType', 'vessel.equipmentType'],
    ['displayMode', 'view.displayMode'],
    ['segments', 'view.segments', (v) => clamp(number(v), 24, 144)],
    ['materialDensity', 'material.density', (v) => Math.max(100, number(v))],
    ['corrosionAllowance', 'material.corrosionAllowance', (v) => Math.max(0, number(v))],
    ['weldEnabled', 'weld.enabled', (v) => Boolean(v)],
    ['weldType', 'weld.type'],
    ['weldSizeFactor', 'weld.sizeFactor', (v) => clamp(number(v), 0.5, 2.5)],

    ['pipeOrientation', 'pipe.orientation'],
    ['pipeLength', 'pipe.length', (v) => Math.max(100, number(v))],
    ['pipeElbowAngle', 'pipe.elbowAngle', (v) => clamp(number(v), 0, 180)],
    ['pipeBendRadius', 'pipe.bendRadius', (v) => Math.max(50, number(v))],
    ['pipeOutletLength', 'pipe.outletLength', (v) => Math.max(100, number(v))],

    ['stdOrientation', 'vessel.standard.orientation'],
    ['stdShellType', 'vessel.standard.shellType'],
    ['stdShellTopOD', 'vessel.standard.shellTopOD', (v) => Math.max(100, number(v))],
    ['stdShellLength', 'vessel.standard.shellLength', (v) => Math.max(200, number(v))],
    ['stdTopHeadType', 'vessel.standard.topHeadType'],
    ['stdBottomHeadType', 'vessel.standard.bottomHeadType'],
    ['stdNozzleEnabled', 'vessel.standard.nozzleEnabled', (v) => Boolean(v)],
    ['stdNozzleDiameter', 'vessel.standard.nozzleDiameter', (v) => Math.max(50, number(v))],
    ['stdNozzleThickness', 'vessel.standard.nozzleThickness', (v) => Math.max(2, number(v))],
    ['stdNozzleProjection', 'vessel.standard.nozzleProjection', (v) => Math.max(50, number(v))],
    ['stdNozzleOffset', 'vessel.standard.nozzleOffset', (v) => number(v)],
    ['stdNozzleAngle', 'vessel.standard.nozzleAngle', (v) => clamp(number(v), -180, 180)],
    ['stdSupportType', 'vessel.standard.supportType'],
    ['stdSaddleSpacing', 'vessel.standard.saddleSpacing', (v) => Math.max(400, number(v))],
    ['stdSaddleWidth', 'vessel.standard.saddleWidth', (v) => Math.max(100, number(v))],
    ['stdSaddleHeight', 'vessel.standard.saddleHeight', (v) => Math.max(100, number(v))],

    ['pigOrientation', 'vessel.pigLauncher.orientation'],
    ['pigMajorLength', 'vessel.pigLauncher.majorLength', (v) => Math.max(400, number(v))],
    ['pigReducerLength', 'vessel.pigLauncher.reducerLength', (v) => Math.max(100, number(v))],
    ['pigNeckLength', 'vessel.pigLauncher.neckLength', (v) => Math.max(200, number(v))],
    ['pigClosureType', 'vessel.pigLauncher.closureType'],
    ['pigTailType', 'vessel.pigLauncher.tailType'],
    ['pigDischargeProjection', 'vessel.pigLauncher.dischargeProjection', (v) => Math.max(100, number(v))],
    ['pigSaddleSpacing', 'vessel.pigLauncher.saddleSpacing', (v) => Math.max(300, number(v))],
    ['pigSaddleWidth', 'vessel.pigLauncher.saddleWidth', (v) => Math.max(100, number(v))],
    ['pigSaddleHeight', 'vessel.pigLauncher.saddleHeight', (v) => Math.max(100, number(v))],
    ['pigVentEnabled', 'vessel.pigLauncher.ventEnabled', (v) => Boolean(v)],
    ['pigVentNozzleDiameter', 'vessel.pigLauncher.ventNozzleDiameter', (v) => Math.max(25, number(v))],
    ['pigKickerEnabled', 'vessel.pigLauncher.kickerEnabled', (v) => Boolean(v)],
    ['pigKickerNozzleDiameter', 'vessel.pigLauncher.kickerNozzleDiameter', (v) => Math.max(25, number(v))],
    ['pigNozzleThickness', 'vessel.pigLauncher.nozzleThickness', (v) => Math.max(2, number(v))],

    ['rebOrientation', 'vessel.reboiler.orientation'],
    ['rebShellLength', 'vessel.reboiler.shellLength', (v) => Math.max(400, number(v))],
    ['rebChannelOD', 'vessel.reboiler.channelOD', (v) => Math.max(100, number(v))],
    ['rebChannelLength', 'vessel.reboiler.channelLength', (v) => Math.max(100, number(v))],
    ['rebRearHeadType', 'vessel.reboiler.rearHeadType'],
    ['rebFrontHeadType', 'vessel.reboiler.frontHeadType'],
    ['rebTubeBundleOD', 'vessel.reboiler.tubeBundleOD', (v) => Math.max(100, number(v))],
    ['rebNozzleDiameter', 'vessel.reboiler.nozzleDiameter', (v) => Math.max(50, number(v))],
    ['rebNozzleProjection', 'vessel.reboiler.nozzleProjection', (v) => Math.max(100, number(v))],
    ['rebSaddleSpacing', 'vessel.reboiler.saddleSpacing', (v) => Math.max(300, number(v))],
    ['rebSaddleWidth', 'vessel.reboiler.saddleWidth', (v) => Math.max(100, number(v))],
    ['rebSaddleHeight', 'vessel.reboiler.saddleHeight', (v) => Math.max(100, number(v))],
  ];

  directMap.forEach(([domKey, path, parser]) => {
    const el = dom[domKey];
    if (!el) return;
    el.addEventListener(eventName(el), () => {
      const raw = el.type === 'checkbox' ? el.checked : el.value;
      store.updatePath(path, parser ? parser(raw) : raw);
    });
  });

  dom.pipeOuterDiameter.addEventListener('input', () => store.syncPipeDimension('outerDiameter', dom.pipeOuterDiameter.value));
  dom.pipeInnerDiameter.addEventListener('input', () => store.syncPipeDimension('innerDiameter', dom.pipeInnerDiameter.value));
  dom.pipeThickness.addEventListener('input', () => store.syncPipeDimension('thickness', dom.pipeThickness.value));

  dom.stdShellOD.addEventListener('input', () => store.syncStandardDimension('shellOD', dom.stdShellOD.value));
  dom.stdShellID.addEventListener('input', () => store.syncStandardDimension('shellID', dom.stdShellID.value));
  dom.stdThickness.addEventListener('input', () => store.syncStandardDimension('thickness', dom.stdThickness.value));

  dom.pigMajorOD.addEventListener('input', () => store.syncPigDimension('majorOD', dom.pigMajorOD.value));
  dom.pigMinorOD.addEventListener('input', () => store.syncPigDimension('minorOD', dom.pigMinorOD.value));
  dom.pigThickness.addEventListener('input', () => store.syncPigDimension('thickness', dom.pigThickness.value));

  dom.rebShellOD.addEventListener('input', () => store.syncReboilerDimension('shellOD', dom.rebShellOD.value));
  dom.rebShellID.addEventListener('input', () => store.syncReboilerDimension('shellID', dom.rebShellID.value));
  dom.rebThickness.addEventListener('input', () => store.syncReboilerDimension('thickness', dom.rebThickness.value));
}

export function renderForm({ dom, state }) {
  const { meta, view, material, pipe, weld } = state;
  const standard = state.vessel.standard;
  const pig = state.vessel.pigLauncher;
  const reb = state.vessel.reboiler;
  const equipmentType = state.vessel.equipmentType;

  dom.modelName.value = meta.name;
  dom.modelType.value = meta.modelType;
  dom.equipmentType.value = equipmentType;
  dom.displayMode.value = view.displayMode;
  dom.segments.value = view.segments;
  dom.materialDensity.value = material.density;
  dom.corrosionAllowance.value = material.corrosionAllowance;
  dom.weldEnabled.checked = weld.enabled;
  dom.weldType.value = weld.type;
  dom.weldSizeFactor.value = weld.sizeFactor;

  dom.pipeOrientation.value = pipe.orientation;
  dom.pipeOuterDiameter.value = pipe.outerDiameter;
  dom.pipeInnerDiameter.value = pipe.innerDiameter;
  dom.pipeThickness.value = pipe.thickness;
  dom.pipeLength.value = pipe.length;
  dom.pipeElbowAngle.value = pipe.elbowAngle;
  dom.pipeBendRadius.value = pipe.bendRadius;
  dom.pipeOutletLength.value = pipe.outletLength;

  dom.stdOrientation.value = standard.orientation;
  dom.stdShellType.value = standard.shellType;
  dom.stdShellOD.value = standard.shellOD;
  dom.stdShellID.value = standard.shellID;
  dom.stdThickness.value = standard.thickness;
  dom.stdShellTopOD.value = standard.shellTopOD;
  dom.stdShellLength.value = standard.shellLength;
  dom.stdTopHeadType.value = standard.topHeadType;
  dom.stdBottomHeadType.value = standard.bottomHeadType;
  dom.stdNozzleEnabled.checked = standard.nozzleEnabled;
  dom.stdNozzleDiameter.value = standard.nozzleDiameter;
  dom.stdNozzleThickness.value = standard.nozzleThickness;
  dom.stdNozzleProjection.value = standard.nozzleProjection;
  dom.stdNozzleOffset.value = standard.nozzleOffset;
  dom.stdNozzleAngle.value = standard.nozzleAngle;
  dom.stdSupportType.value = standard.supportType;
  dom.stdSaddleSpacing.value = standard.saddleSpacing;
  dom.stdSaddleWidth.value = standard.saddleWidth;
  dom.stdSaddleHeight.value = standard.saddleHeight;

  dom.pigOrientation.value = pig.orientation;
  dom.pigMajorOD.value = pig.majorOD;
  dom.pigMinorOD.value = pig.minorOD;
  dom.pigThickness.value = pig.thickness;
  dom.pigMajorLength.value = pig.majorLength;
  dom.pigReducerLength.value = pig.reducerLength;
  dom.pigNeckLength.value = pig.neckLength;
  dom.pigClosureType.value = pig.closureType;
  dom.pigTailType.value = pig.tailType;
  dom.pigDischargeProjection.value = pig.dischargeProjection;
  dom.pigSaddleSpacing.value = pig.saddleSpacing;
  dom.pigSaddleWidth.value = pig.saddleWidth;
  dom.pigSaddleHeight.value = pig.saddleHeight;
  dom.pigVentEnabled.checked = pig.ventEnabled;
  dom.pigVentNozzleDiameter.value = pig.ventNozzleDiameter;
  dom.pigKickerEnabled.checked = pig.kickerEnabled;
  dom.pigKickerNozzleDiameter.value = pig.kickerNozzleDiameter;
  dom.pigNozzleThickness.value = pig.nozzleThickness;

  dom.rebOrientation.value = reb.orientation;
  dom.rebShellOD.value = reb.shellOD;
  dom.rebShellID.value = reb.shellID;
  dom.rebThickness.value = reb.thickness;
  dom.rebShellLength.value = reb.shellLength;
  dom.rebChannelOD.value = reb.channelOD;
  dom.rebChannelLength.value = reb.channelLength;
  dom.rebRearHeadType.value = reb.rearHeadType;
  dom.rebFrontHeadType.value = reb.frontHeadType;
  dom.rebTubeBundleOD.value = reb.tubeBundleOD;
  dom.rebNozzleDiameter.value = reb.nozzleDiameter;
  dom.rebNozzleProjection.value = reb.nozzleProjection;
  dom.rebSaddleSpacing.value = reb.saddleSpacing;
  dom.rebSaddleWidth.value = reb.saddleWidth;
  dom.rebSaddleHeight.value = reb.saddleHeight;

  const isPipe = meta.modelType === 'pipe';
  dom.pipePanel.classList.toggle('hidden', !isPipe);
  dom.weldPanel.classList.toggle('hidden', isPipe);
  dom.equipmentTypeWrap.classList.toggle('hidden', isPipe);
  dom.standardPanel.classList.toggle('hidden', isPipe || equipmentType !== 'standard');
  dom.pigLauncherPanel.classList.toggle('hidden', isPipe || equipmentType !== 'pigLauncher');
  dom.reboilerPanel.classList.toggle('hidden', isPipe || equipmentType !== 'reboiler');

  dom.stdShellTopODWrap.classList.toggle('hidden', standard.shellType !== 'tapered');
  dom.stdNozzleFields.forEach((field) => field.classList.toggle('hidden', !standard.nozzleEnabled));

  const supportMode = standard.supportType === 'auto'
    ? (standard.orientation === 'horizontal' ? 'saddles' : 'skirt')
    : standard.supportType;
  const showSaddles = supportMode === 'saddles';
  dom.stdSaddleSpacingWrap.classList.toggle('hidden', !showSaddles);
  dom.stdSaddleWidthWrap.classList.toggle('hidden', !showSaddles);
  dom.stdSaddleHeightWrap.classList.toggle('hidden', !showSaddles);

  dom.pigVentNozzleWrap.classList.toggle('hidden', !pig.ventEnabled);
  dom.pigKickerNozzleWrap.classList.toggle('hidden', !pig.kickerEnabled);

  dom.viewerTitle.textContent = meta.name;
  if (isPipe) {
    dom.viewerSubTitle.textContent = ' — Pipe Builder dinamis: OD/ID/t/elbow/orientation';
  } else if (equipmentType === 'pigLauncher') {
    dom.viewerSubTitle.textContent = ' — Pig Launcher: major barrel + reducer + neck + utility nozzles';
  } else if (equipmentType === 'reboiler') {
    dom.viewerSubTitle.textContent = ' — Reboiler: shell + channel + rear head + tube bundle';
  } else {
    dom.viewerSubTitle.textContent = ' — Standard Vessel: shell/head/nozzle/support';
  }
}
