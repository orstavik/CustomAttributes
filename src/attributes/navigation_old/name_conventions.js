//The [name] convention.
// get all non-empty [name] descendants, but only one level deep in the [name] hierarchy.
export function getNames(scope) {
  return scope.querySelectorAll(':scope > [name]:not([name=""]),:scope :not([name]) [name]:not([name=""])');
}

//The [.value] convention.
// 1. HTML 1: direct attribute on element wins, first [value], then [src].
// 2. HTML 2: [name]children list.
//             If the element has [name] (no [value] nor [src]), and then lots of children with [name] attributes,
//             then the value is a `;` separated lists of the [name] value of its children.
// 3. JS: if the .value property has been declared on the element, we use that.
// 4. Fallback solution: outerHTML.                          //todo should we have outerHTML? or just null?
export function getValue(el) {
  if (el.hasAttribute("value")) return el.getAttribute("value");
  if (el.hasAttribute("src")) return el.getAttribute("src");
  const childrenName = el.querySelectorAll(':scope > [name]:not([name=""])');
  return childrenName.length ? [...childrenName].map(el => el.getAttribute("name")).join(";") :
    "value" in el ? el.value :
      el.outerHTML;
}
