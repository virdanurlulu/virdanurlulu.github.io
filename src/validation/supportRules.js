export function validateSupports(model) {
  const issues = [];
  const primary = model.supports?.[0];
  const shell = model.body.shellSections?.find((s) => s.odStart === s.odEnd) || model.body.shellSections?.[0];
  if (primary && shell && primary.type === 'saddle' && primary.spacing >= shell.length * 1.2) {
    issues.push('Saddle spacing terlalu besar terhadap panjang shell utama.');
  }
  return issues;
}
