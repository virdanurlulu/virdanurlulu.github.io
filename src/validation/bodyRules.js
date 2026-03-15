export function validateBody(model) {
  const issues = [];
  model.body.shellSections?.forEach((section) => {
    const minOD = Math.min(section.odStart, section.odEnd);
    if (section.thickness * 2 >= minOD) issues.push(`Thickness terlalu besar terhadap OD pada ${section.tag}.`);
    if (section.length <= 0) issues.push(`Length harus positif pada ${section.tag}.`);
  });
  return issues;
}
