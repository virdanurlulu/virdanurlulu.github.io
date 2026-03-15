import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js';
import { createMaterialSet, createOpenShellSection, createTubeBundle, orientEquipment } from './shellBuilder.js';
import { createHead, createClosureRing } from './headBuilder.js';
import { createRadialNozzle, createAxialNozzle, createPipeNozzle, createFlangedNozzle, createNozzleLabel } from './nozzleBuilder.js';
import { addHorizontalSaddles, addVerticalSkirt } from './supportBuilder.js';

function resolveSupportType(item) {
  if (item.supportType && item.supportType !== 'auto') return item.supportType;
  return item.orientation === 'horizontal' ? 'saddles' : 'skirt';
}

function createAuxCylinder(radius, length, material, radialSegments = 24) {
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, radialSegments), material);
}

function addComponentTag(group, text, position, scale = 180) {
  const tag = createNozzleLabel(text, { scale });
  tag.position.copy(position);
  group.add(tag);
}

function addRingFlange(group, { radius, thickness, width, y, material }) {
  const flange = createOpenShellSection({
    radiusBottom: radius,
    radiusTop: radius,
    thickness,
    length: width,
    segments: 48,
    material,
  });
  flange.position.y = y;
  group.add(flange);
  return flange;
}

function buildQuickOpeningClosureAssembly({ radius, thickness, closureType, materialBase, materialAccent, y }) {
  const group = new THREE.Group();
  const seatLength = Math.max(thickness * 3.4, 70);
  const doorOffset = seatLength + Math.max(thickness * 1.2, 30);

  const seat = createOpenShellSection({
    radiusBottom: radius,
    radiusTop: radius,
    thickness,
    length: seatLength,
    segments: 64,
    material: materialAccent,
  });
  seat.position.y = y - seatLength / 2;
  group.add(seat);

  const clampRing = createClosureRing({ radius: radius * 1.015, thickness: Math.max(thickness * 1.2, 12), material: materialAccent });
  clampRing.rotation.y = Math.PI / 2;
  clampRing.position.y = y;
  group.add(clampRing);

  const door = createHead({
    type: closureType,
    radius,
    thickness,
    segments: 64,
    material: materialBase,
    isTop: false,
  });
  door.group.position.y = y - doorOffset;
  group.add(door.group);

  const outerClamp = createOpenShellSection({
    radiusBottom: radius * 1.09,
    radiusTop: radius * 1.09,
    thickness: radius * 0.11,
    length: Math.max(thickness * 1.4, 26),
    segments: 64,
    material: materialAccent,
  });
  outerClamp.position.y = y - seatLength * 0.18;
  group.add(outerClamp);

  const hingeX = radius * 0.98;
  const hingeY = y - seatLength * 0.52;
  const hingeZ = radius * 0.16;
  const hingeBody = createAuxCylinder(Math.max(thickness * 0.28, 14), radius * 0.34, materialAccent, 18);
  hingeBody.rotation.x = Math.PI / 2;
  hingeBody.position.set(hingeX, hingeY, 0);
  group.add(hingeBody);

  const hingeEar1 = createAuxCylinder(Math.max(thickness * 0.18, 8), radius * 0.16, materialAccent, 14);
  hingeEar1.rotation.z = Math.PI / 2;
  hingeEar1.position.set(hingeX, hingeY, hingeZ);
  group.add(hingeEar1);

  const hingeEar2 = hingeEar1.clone();
  hingeEar2.position.z = -hingeZ;
  group.add(hingeEar2);

  const davitStem = createAuxCylinder(Math.max(thickness * 0.16, 8), radius * 0.72, materialAccent, 14);
  davitStem.position.set(radius * 1.18, y - doorOffset * 0.65, 0);
  group.add(davitStem);

  const davitArm = createAuxCylinder(Math.max(thickness * 0.15, 7), radius * 0.82, materialAccent, 14);
  davitArm.rotation.z = Math.PI / 2;
  davitArm.position.set(radius * 1.16, y - doorOffset * 0.92, 0);
  group.add(davitArm);

  const handWheel = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.13, Math.max(thickness * 0.09, 5), 12, 28),
    materialAccent
  );
  handWheel.rotation.y = Math.PI / 2;
  handWheel.position.set(radius * 1.43, y - doorOffset * 1.02, 0);
  group.add(handWheel);

  addComponentTag(group, 'QOC', new THREE.Vector3(radius * 1.15, y - doorOffset * 1.28, radius * 0.58), Math.max(radius * 0.34, 180));
  return group;
}

function buildStandard(state) {
  const { standard: item } = state.vessel;
  const mats = createMaterialSet(state.view.displayMode);
  const group = new THREE.Group();
  group.name = 'StandardVessel';

  const bottomRadius = item.shellOD / 2;
  const topRadius = (item.shellType === 'tapered' ? item.shellTopOD : item.shellOD) / 2;
  const shell = createOpenShellSection({
    radiusBottom: bottomRadius,
    radiusTop: topRadius,
    thickness: item.thickness,
    length: item.shellLength,
    segments: state.view.segments,
    material: mats.base,
  });
  group.add(shell);

  const topHead = createHead({
    type: item.topHeadType,
    radius: topRadius,
    thickness: item.thickness,
    segments: state.view.segments,
    material: mats.base,
    isTop: true,
  });
  topHead.group.position.y += item.shellLength / 2;
  group.add(topHead.group);

  const bottomHead = createHead({
    type: item.bottomHeadType,
    radius: bottomRadius,
    thickness: item.thickness,
    segments: state.view.segments,
    material: mats.base,
    isTop: false,
  });
  bottomHead.group.position.y -= item.shellLength / 2;
  group.add(bottomHead.group);

  if (item.nozzleEnabled) {
    const nozzle = createRadialNozzle({
      nozzleDiameter: item.nozzleDiameter,
      nozzleThickness: item.nozzleThickness,
      nozzleProjection: item.nozzleProjection,
      nozzleOffset: item.nozzleOffset,
      nozzleAngle: item.nozzleAngle,
      shellType: item.shellType,
      shellOD: item.shellOD,
      shellTopOD: item.shellTopOD,
      shellLength: item.shellLength,
      material: mats.accent,
      flanged: true,
      label: 'N1',
    });
    group.add(nozzle);
  }

  const supportMode = resolveSupportType(item);
  if (supportMode === 'saddles') {
    addHorizontalSaddles(group, {
      barrelRadius: bottomRadius,
      spacing: item.saddleSpacing,
      width: item.saddleWidth,
      height: item.saddleHeight,
      material: mats.support,
    });
  } else if (supportMode === 'skirt') {
    const skirtHeight = Math.max(bottomRadius * 0.8, 500);
    addVerticalSkirt(group, {
      barrelRadius: bottomRadius,
      skirtHeight,
      thickness: Math.max(item.thickness, 8),
      bottomOffset: -item.shellLength / 2 - bottomHead.height,
      material: mats.support,
    });
  }

  orientEquipment(group, item.orientation);
  return group;
}

function buildPigLauncher(state) {
  const { pigLauncher: item } = state.vessel;
  const mats = createMaterialSet(state.view.displayMode);
  const group = new THREE.Group();
  group.name = 'PigLauncher';

  const majorRadius = item.majorOD / 2;
  const minorRadius = item.minorOD / 2;
  const reducerStartY = item.majorLength / 2;
  const neckCenterY = reducerStartY + item.reducerLength + item.neckLength / 2;

  const qoc = buildQuickOpeningClosureAssembly({
    radius: majorRadius,
    thickness: item.thickness,
    closureType: item.closureType,
    materialBase: mats.base,
    materialAccent: mats.accent,
    y: -item.majorLength / 2,
  });
  group.add(qoc);

  const majorBarrel = createOpenShellSection({
    radiusBottom: majorRadius,
    radiusTop: majorRadius,
    thickness: item.thickness,
    length: item.majorLength,
    segments: state.view.segments,
    material: mats.base,
  });
  group.add(majorBarrel);

  addRingFlange(group, {
    radius: majorRadius * 1.02,
    thickness: Math.max(item.thickness * 1.8, 18),
    width: Math.max(item.thickness * 1.7, 24),
    y: -item.majorLength / 2 + Math.max(item.thickness, 16),
    material: mats.accent,
  });

  const reducer = createOpenShellSection({
    radiusBottom: majorRadius,
    radiusTop: minorRadius,
    thickness: item.thickness,
    length: item.reducerLength,
    segments: state.view.segments,
    material: mats.base,
  });
  reducer.position.y = reducerStartY + item.reducerLength / 2;
  group.add(reducer);

  addRingFlange(group, {
    radius: majorRadius * 1.01,
    thickness: Math.max(item.thickness * 1.5, 16),
    width: Math.max(item.thickness * 1.2, 20),
    y: reducerStartY + Math.max(item.thickness, 10),
    material: mats.accent,
  });

  const neck = createOpenShellSection({
    radiusBottom: minorRadius,
    radiusTop: minorRadius,
    thickness: item.thickness,
    length: item.neckLength,
    segments: state.view.segments,
    material: mats.base,
  });
  neck.position.y = neckCenterY;
  group.add(neck);

  addRingFlange(group, {
    radius: minorRadius * 1.02,
    thickness: Math.max(item.thickness * 1.4, 14),
    width: Math.max(item.thickness * 1.2, 18),
    y: reducerStartY + item.reducerLength + Math.max(item.thickness, 10),
    material: mats.accent,
  });

  const tailHead = createHead({
    type: item.tailType,
    radius: minorRadius,
    thickness: item.thickness,
    segments: state.view.segments,
    material: mats.base,
    isTop: true,
  });
  tailHead.group.position.y = reducerStartY + item.reducerLength + item.neckLength;
  group.add(tailHead.group);

  const axialOutlet = createAxialNozzle({
    nozzleDiameter: item.minorOD * 0.72,
    nozzleThickness: item.nozzleThickness,
    nozzleProjection: item.dischargeProjection,
    material: mats.accent,
    flanged: true,
    label: 'N3',
  });
  axialOutlet.position.y = reducerStartY + item.reducerLength + item.neckLength + tailHead.height + item.dischargeProjection / 2;
  group.add(axialOutlet);

  if (item.ventEnabled) {
    const vent = createFlangedNozzle({
      outerRadius: item.ventNozzleDiameter / 2,
      thickness: item.nozzleThickness,
      length: Math.max(item.ventNozzleDiameter * 2.6, 210),
      material: mats.accent,
      label: 'N1',
      flangeOuterRadius: item.ventNozzleDiameter,
      boltCount: 8,
    });
    vent.rotation.z = Math.PI / 2;
    vent.position.set(majorRadius + item.ventNozzleDiameter * 0.85, -item.majorLength * 0.1, 0);
    group.add(vent);
  }

  if (item.kickerEnabled) {
    const kicker = createFlangedNozzle({
      outerRadius: item.kickerNozzleDiameter / 2,
      thickness: item.nozzleThickness,
      length: Math.max(item.kickerNozzleDiameter * 2.8, 180),
      material: mats.accent,
      label: 'N2',
      flangeOuterRadius: item.kickerNozzleDiameter * 0.95,
      boltCount: 8,
    });
    kicker.rotation.x = Math.PI / 2;
    kicker.position.set(0, reducerStartY - item.reducerLength * 0.15, -majorRadius * 0.9);
    group.add(kicker);
  }

  addHorizontalSaddles(group, {
    barrelRadius: majorRadius,
    spacing: item.saddleSpacing,
    width: item.saddleWidth,
    height: item.saddleHeight,
    material: mats.support,
  });

  orientEquipment(group, item.orientation);
  return group;
}

function buildReboiler(state) {
  const { reboiler: item } = state.vessel;
  const mats = createMaterialSet(state.view.displayMode);
  const group = new THREE.Group();
  group.name = 'Reboiler';

  const shellRadius = item.shellOD / 2;
  const channelRadius = item.channelOD / 2;
  const frontFlangeGap = Math.max(item.thickness * 0.6, 12);
  const flangeWidth = Math.max(item.thickness * 1.8, 28);

  const mainShell = createOpenShellSection({
    radiusBottom: shellRadius,
    radiusTop: shellRadius,
    thickness: item.thickness,
    length: item.shellLength,
    segments: state.view.segments,
    material: mats.base,
  });
  group.add(mainShell);

  const rearHead = createHead({
    type: item.rearHeadType,
    radius: shellRadius,
    thickness: item.thickness,
    segments: state.view.segments,
    material: mats.base,
    isTop: true,
  });
  rearHead.group.position.y = item.shellLength / 2;
  group.add(rearHead.group);

  addRingFlange(group, {
    radius: shellRadius * 1.015,
    thickness: Math.max(item.thickness * 1.7, 18),
    width: flangeWidth,
    y: -item.shellLength / 2 - flangeWidth / 2,
    material: mats.accent,
  });

  addRingFlange(group, {
    radius: channelRadius * 1.02,
    thickness: Math.max(item.thickness * 1.7, 18),
    width: flangeWidth,
    y: -item.shellLength / 2 - flangeWidth - frontFlangeGap,
    material: mats.accent,
  });

  const channel = createOpenShellSection({
    radiusBottom: channelRadius,
    radiusTop: channelRadius,
    thickness: item.thickness,
    length: item.channelLength,
    segments: state.view.segments,
    material: mats.base,
  });
  channel.position.y = -item.shellLength / 2 - item.channelLength / 2 - flangeWidth - frontFlangeGap;
  group.add(channel);

  const channelHead = createHead({
    type: item.frontHeadType,
    radius: channelRadius,
    thickness: item.thickness,
    segments: state.view.segments,
    material: mats.base,
    isTop: false,
  });
  channelHead.group.position.y = -item.shellLength / 2 - item.channelLength - flangeWidth - frontFlangeGap;
  group.add(channelHead.group);

  addRingFlange(group, {
    radius: channelRadius * 1.03,
    thickness: Math.max(item.thickness * 1.9, 18),
    width: flangeWidth,
    y: -item.shellLength / 2 - item.channelLength - flangeWidth - frontFlangeGap + Math.max(item.thickness, 10),
    material: mats.accent,
  });

  const passPartition = new THREE.Mesh(
    new THREE.BoxGeometry(channelRadius * 0.08, channelRadius * 1.6, item.thickness * 0.85),
    mats.accent
  );
  passPartition.position.set(0, -item.shellLength / 2 - item.channelLength * 0.5 - flangeWidth - frontFlangeGap, 0);
  group.add(passPartition);

  const tubeBundle = createTubeBundle({
    radius: item.tubeBundleOD / 2,
    length: item.shellLength * 0.94,
    material: new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      metalness: 0.15,
      roughness: 0.75,
      transparent: state.view.displayMode === 'ghost',
      opacity: state.view.displayMode === 'ghost' ? 0.32 : 0.88,
      wireframe: state.view.displayMode === 'wireframe',
    }),
  });
  tubeBundle.rotation.z = Math.PI / 2;
  group.add(tubeBundle);

  const shellNozzle1 = createFlangedNozzle({
    outerRadius: item.nozzleDiameter / 2,
    thickness: Math.max(item.thickness * 0.6, 6),
    length: item.nozzleProjection,
    material: mats.accent,
    label: 'N1',
    boltCount: 8,
  });
  shellNozzle1.rotation.z = Math.PI / 2;
  shellNozzle1.position.set(shellRadius + item.nozzleProjection / 2 - 24, -item.shellLength * 0.22, 0);
  group.add(shellNozzle1);

  const shellNozzle2 = createFlangedNozzle({
    outerRadius: item.nozzleDiameter * 0.76 / 2,
    thickness: Math.max(item.thickness * 0.6, 6),
    length: item.nozzleProjection * 0.82,
    material: mats.accent,
    label: 'N2',
    boltCount: 8,
  });
  shellNozzle2.rotation.z = Math.PI / 2;
  shellNozzle2.position.set(-(shellRadius + item.nozzleProjection * 0.41), item.shellLength * 0.18, 0);
  group.add(shellNozzle2);

  const channelNozzle = createFlangedNozzle({
    outerRadius: item.nozzleDiameter * 0.72 / 2,
    thickness: Math.max(item.thickness * 0.6, 6),
    length: item.nozzleProjection * 0.76,
    material: mats.accent,
    label: 'N3',
    boltCount: 8,
  });
  channelNozzle.rotation.x = Math.PI / 2;
  channelNozzle.position.set(0, -item.shellLength / 2 - item.channelLength * 0.56 - flangeWidth - frontFlangeGap, channelRadius + item.nozzleProjection * 0.38);
  group.add(channelNozzle);

  const ventBox = createPipeNozzle({
    outerRadius: Math.max(item.nozzleDiameter * 0.18, 24),
    thickness: Math.max(item.thickness * 0.35, 4),
    length: Math.max(item.channelLength * 0.32, 120),
    material: mats.accent,
  });
  ventBox.rotation.z = Math.PI / 2;
  ventBox.position.set(channelRadius + 90, -item.shellLength / 2 - item.channelLength * 0.16 - flangeWidth - frontFlangeGap, 0);
  group.add(ventBox);

  addHorizontalSaddles(group, {
    barrelRadius: shellRadius,
    spacing: item.saddleSpacing,
    width: item.saddleWidth,
    height: item.saddleHeight,
    material: mats.support,
  });

  addComponentTag(group, 'CH', new THREE.Vector3(channelRadius * 0.2, -item.shellLength / 2 - item.channelLength * 0.5 - flangeWidth - frontFlangeGap, channelRadius * 1.05), Math.max(channelRadius * 0.32, 160));

  orientEquipment(group, item.orientation);
  return group;
}

export function buildVesselModel(state) {
  const type = state.vessel.equipmentType;
  if (type === 'pigLauncher') return buildPigLauncher(state);
  if (type === 'reboiler') return buildReboiler(state);
  return buildStandard(state);
}
