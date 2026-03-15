import { TAG_PREFIX } from './tagRules.js';

function nextTag(prefix, index) {
  return `${prefix}-${String(index + 1).padStart(2, '0')}`;
}

export function applyNaming(model) {
  model.body.shellSections?.forEach((item, index) => { if (!item.tag) item.tag = nextTag(TAG_PREFIX.shellSections, index); });
  ['front','rear'].forEach((side, index) => {
    const item = model.body.heads?.[side];
    if (item && !item.tag) item.tag = nextTag(TAG_PREFIX.heads, index);
  });
  model.body.bodyFlanges?.forEach((item, index) => { if (!item.tag) item.tag = nextTag(TAG_PREFIX.bodyFlanges, index); });
  if (model.body.closure && !model.body.closure.tag) model.body.closure.tag = `${TAG_PREFIX.closure}-01`;
  model.nozzles?.forEach((item, index) => { if (!item.tag) item.tag = index === 0 ? 'N1' : `N${index + 1}`; });
  model.supports?.forEach((item, index) => { if (!item.tag) item.tag = index < 2 ? `S${index + 1}` : nextTag(TAG_PREFIX.supports, index); });
  model.externalAttachments?.forEach((item, index) => { if (!item.tag) item.tag = nextTag(TAG_PREFIX.externalAttachments, index); });
  model.internalAttachments?.forEach((item, index) => { if (!item.tag) item.tag = nextTag(TAG_PREFIX.internalAttachments, index); });
  model.removableInternals?.forEach((item, index) => { if (!item.tag) item.tag = nextTag(TAG_PREFIX.removableInternals, index); });
  return model;
}
