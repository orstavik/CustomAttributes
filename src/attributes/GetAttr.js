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
function getNames(root) {
  return root.querySelectorAll(':root > [name]:not([name=""]), :not([name]) [name]:not([name=""])');
}

//The [.value] convention.
// 1. HTML 1: direct attribute on element wins, first [value], then [src].
// 2. HTML 2: children attribute list. if the element has [name] and then lots of children with [name] attributes,
//    then it is a list and made as such.
// 3. JS: if the .value property has been declared on the element, we use that.
// 4. Fallback solution: outerHTML.
function getValue(el) {
  if (el.hasAttribute("value")) return el.getAttribute("value");
  if (el.hasAttribute("src")) return el.getAttribute("src");
  const childrenName = el.querySelectorAll(':root > [name]:not([name=""])');
  return childrenName.length ? [...childrenName].map(el => el.getAttribute("name")) :
    "value" in el ? el.value :
      el.outerHTML;
}

export class GETAttrWithValues extends Attr {
  onEvent(e) {
    const query = getNames(this.ownerElement)            //todo do we need to encode the [name] attribute too?
      .map(el => `${el.getAttribute("name")}=${encodeURIComponent(getValue(el))}`).join("&");
    open(this.value + "?" + query);
  }
}