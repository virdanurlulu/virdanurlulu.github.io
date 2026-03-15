export function validateNozzles(model) {
  const issues = [];
  const mainSection = model.body.shellSections?.[0];
  model.nozzles?.forEach((nozzle) => {
    if (!nozzle.enabled) return;
    if (nozzle.neck.thickness * 2 >= nozzle.neck.od) issues.push(`${nozzle.tag}: thickness neck terlalu besar.`);
    if (mainSection && nozzle.location.mode === 'radial') {
      const half = mainSection.length / 2;
      if (Math.abs(nozzle.location.offset) > half) issues.push(`${nozzle.tag}: offset aksial di luar panjang shell section.`);
    }
  });
  return issues;
}
