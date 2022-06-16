//The [name] attribute creates .name and .value getters on the ownerElement.
//The two getters reflect the current state of the DOM, they provide a simplified/reduced state of the element.
//This principle differs from the `<input name=x value=y>` pattern. The native `.value` is the original value, not
//the current value. This native principle is wrong, the original value can be set in a `reset` attribute, that enables
//the element's value to be reset.

//The name/value gives a customized

//The .value property reflects the state of the element, which should also be reflected in the DOM.
//
// 1. [value]
// 2. the .value property of the prototype/element type definition
// 3. .outerHTML
function valueBasic() {
  if (this.hasAttribute("value"))
    return this.getAttribute("value");  //todo if the value attr is a number, should we turn that into a number??
  if ("value" in Object.getPrototypeOf(this))
    return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "value").get.call(this);
  return this.outerHTML;
}

//An extended .value property adds the [src] attribute to the lightDom checks, and
// also uses the childrenWithName fallback before the outerHTML:
//
// 1. [value]
// 2. [src]
// 3. the .value property of the prototype/element type definition
// 4. [...children[name]]
// 5. outerHTML
function valueExtended() {
  if (this.hasAttribute("value"))
    return this.getAttribute("value");
  if (this.hasAttribute("src"))
    return this.getAttribute("src");
  if ("value" in Object.getPrototypeOf(this))
    return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "value").get.call(this);
  const childrenWithName = [...this.children].map(c => c.getAttribute("name")).filter(s => s);
  return childrenWithName.length ? childrenWithName : this.outerHTML;
}

function getName(){
  return this.getAttribute("name");
}

export class NameAttr extends Attr {
  upgrade() {
    Object.defineProperty(this.ownerElement, "name", {get: getName});
    Object.defineProperty(this.ownerElement, "value", {get: valueExtended});
  }

  remove() {
    delete this.ownerElement.name;
    delete this.ownerElement.value;
  }
}

export class BasicNameAttr extends Attr {
  upgrade() {
    Object.defineProperty(this.ownerElement, "name", {get: getName});
    Object.defineProperty(this.ownerElement, "value", {get: valueBasic});
  }

  remove() {
    delete this.ownerElement.name;
    delete this.ownerElement.value;
  }
}