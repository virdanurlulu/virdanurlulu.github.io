import { validateBody } from './bodyRules.js';
import { validateNozzles } from './nozzleRules.js';
import { validateSupports } from './supportRules.js';

export function getValidationIssues(model) {
  return [
    ...validateBody(model),
    ...validateNozzles(model),
    ...validateSupports(model),
  ];
}
