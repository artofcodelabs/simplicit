// Every data-* attribute Simplicit reads from the DOM, in one place.
//
// These names are a public contract: they appear in user-authored HTML and in
// the README, so they change only in a breaking release. They live here for
// typo safety — a misspelled import fails at module load, a misspelled string
// literal fails silently at runtime.
//
// Nothing outside this file spells a data-* name — reads go through
// getAttribute(CONST), never element.dataset.x, so grepping a name finds every
// site that touches it.

export const COMPONENT = "data-component";
export const COMPONENT_ID = "data-component-id";
export const CONTAINER = "data-container-component";
export const PROPS = "data-props";
export const KEY = "data-key";
export const REF = "data-ref";
export const MODEL = "data-model";
export const TARGET = "data-target";
export const POSITION = "data-position";

// Read by init() from <body>.
export const NAMESPACE = "data-namespace";
export const CONTROLLER = "data-controller";
export const ACTION = "data-action";
