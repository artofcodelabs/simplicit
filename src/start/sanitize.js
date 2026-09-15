import DOMPurify from "dompurify";

// Sanitize by parsing first, then cleaning the DOM — not by cleaning a string.
//
// DOMPurify parses a string in a <body> context, where the HTML parser
// silently discards anything that may only appear inside a table or a select:
// a bare <tr> comes back as its text alone. A representation rooted at <tr> is
// perfectly valid — its container is a <tbody> — so string sanitizing would
// make table markup unrenderable.
//
// A <template> is the right parser context (the spec routes <tr> to "in table
// body") and its content is inert: no resource loads, no script execution. So
// parse there, then let DOMPurify clean each root in place. It refuses a
// forbidden root rather than passing it through, so those are dropped.
export const sanitizedFragment = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const child of [...template.content.children]) {
    try {
      DOMPurify.sanitize(child, { IN_PLACE: true });
    } catch {
      child.remove();
    }
  }
  return template.content;
};
