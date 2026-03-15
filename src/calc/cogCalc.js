export function getApproxCoG(model) {
  const totalLength = model.body.shellSections.reduce((sum, section) => sum + section.length, 0);
  return { x: 0, y: 0, z: 0, axialReference: totalLength / 2 };
}
