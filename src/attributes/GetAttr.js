export class GETAttr extends Attr {
  onEvent(e) {
    open(this.value, "_self");
  }
}

export class GET_blankAttr extends Attr {
  onEvent(e) {
    open(this.value, "_blank");
  }
}

export function targetedGETAttr(target = "_blank") {
  target = target.toLowerCase();
  if (["_blank", "_self", "_parent", "_top"].indexOf(target) < 0)
    throw 'target must be either:  "_blank", "_self", "_parent", or "_top".';
  return class GETAttr extends Attr {
    onEvent(e) {
      open(this.value, target);
    }
  }
}

//The [name] convention.
// get all non-empty [name] descendants, but only one level deep in the [name] hierarchy.
function getNames(scope) {
  return scope.querySelectorAll(':scope > [name]:not([name=""]),:scope :not([name]) [name]:not([name=""])');
}

//The [.value] convention.
// 1. HTML 1: direct attribute on element wins, first [value], then [src].
// 2. HTML 2: [name]children list.
//             If the element has [name] (no [value] nor [src]), and then lots of children with [name] attributes,
//             then the value is a `;` separated lists of the [name] value of its children.
// 3. JS: if the .value property has been declared on the element, we use that.
// 4. Fallback solution: outerHTML.                          //todo should we have outerHTML? or just null?
function getValue(el) {
  if (el.hasAttribute("value")) return el.getAttribute("value");
  if (el.hasAttribute("src")) return el.getAttribute("src");
  const childrenName = el.querySelectorAll(':scope > [name]:not([name=""])');
  return childrenName.length ? [...childrenName].map(el => el.getAttribute("name")).join(";") :
    "value" in el ? el.value :
      el.outerHTML;
}

export class GETAttrWithValues extends Attr {
  onEvent(e) {
    const url = new URL(this.value);
    url.search = new URLSearchParams([...getNames(this.ownerElement)].map(c => [c.getAttribute("name"), getValue(c)]));
    open(url.href);
  }
}