export function orientEquipment(group, orientation) {
  group.rotation.set(0, 0, 0);
  if (orientation === 'horizontal') group.rotation.z = Math.PI / 2;
}
