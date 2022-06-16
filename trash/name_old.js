
//action="bbc.com"
//action-submit_post_formdata_self_once="bbc.com" //do this dispatch only once for the particular event.

//observe-class="classChanged highlight somethign"

//action-get

//co-dblclick=submit post-formdata_self_once="bbc.com"
//post-dblclick_formdata_self_once="bbc.com"

// export function NoAttr(eventName_filter) {
//   const [eventName, ...filter] = eventName_filter.split("_");
//   const eventFilter = makeEventFilter(eventName, filter); //todo do the previous line together with the above
//   return class NoAttr extends Attr {
//     upgrade() {
//       this._listener = e => (!eventFilter || !eventFilter(e)) && e.preventDefault();
//       this.ownerElement.addEventListener(eventName, this._listener);
//     }
//
//     remove() {
//       this.ownerElement.removeEventListener(eventName, this._listener);
//       this.ownerElement.removeAttributeNode(this);
//     }
//   };
// }
//
// export function CoAttr(eventName_filter) {
//   // const [eventName, ...filter] = eventName_filter.split("_");
//   const [eventName, eventFilterFunc] = makeEventFilter(eventName_filter);
//   return class CoAttr extends Attr {
//
//     upgrade() {
//       this._listener = e => (!eventFilterFunc || !eventFilterFunc(e)) && this.onEvent(e);
//       this.ownerElement.addEventListener(eventName, this._listener);
//     }
//
//     onEvent(e) {
//       runDefaultAction(e, _ => this.ownerElement.dispatchEvent(cloneEvent(e, this.value)));
//     }
//
//     remove() {
//       this.ownerElement.removeEventListener(eventName, this._listener);
//       this.ownerElement.removeAttributeNode(this);
//     }
//   }
// }



//todo this doesn't work really. because the `.value` property will only be active when the `name` attribute is set, and
// not when there is no `value` attribute. This is not good. This means instead that the definition must come from the [name]
// attribute, and that the `name`,`value` is a pair. Ie. this means that when you define `name`, you also lock "value",
// without giving it a definition. or. the [name] attribute needs to bind *two* props: `.name` and `.value`.
// It doesn't have to lock the [value] attr, if somebody else wants to add more functionality to [value], then so be it.

//[action] depends on [values] that depends on [name] which define .value/.name

// so.we have attribute definitions that work in pairs. or clusters. That are defined together.

//if you see my screen, I am just trying to think a little with music on the ear.
//i am not sure i am good to copilot with right now. give me 30min.
export class ValueAttr extends HTMLElement {
  upgrade() {
    Object.defineProperty(this.ownerElement, "value", {
      get: function getValue() {
        if (this.hasAttribute("value"))
          return this.getAttribute("value");  //todo if the value attr is a number, should we turn that into a number??
        if (this.hasAttribute("src"))
          return this.getAttribute("src");
        if (this.children.length)
          return [...this.children].map(c => c.getAttribute("name")).filter(s => s);
        if ("value" in Object.getPrototypeOf(this))
          return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "value").get.call(this);
        //return this.innerHTML;
        // todo must be a translation of state that is already visible in the dom,
        //  ie. either .innerHTML or some combination of the elements attributes and .innerHTML
        return this.innerText;
      }
    });
  }
}

export class NameAttr extends HTMLElement {
  upgrade() {
    Object.defineProperty(this.ownerElement, "name", {
      get: function getValue() {
        return this.getAttribute("name");
      }
    });
  }
}

function getElements() {
  return this.querySelectorAll(":root > [name], :root :not([name]) [name]"); //todo test this
}

export class ValuesAttr extends HTMLElement {
  upgrade() {
    if (this.value)

      Object.defineProperty(this.ownerElement, "name", {
        get: function getValue() {
          return this.getAttribute("name");
        }
      });
  }
}

//The [name] attribute creates a .value getter on the ownerElement.

//The .value property reflects the state of the element, which should also be reflected in the DOM.
//This is a universal property for all elements. It is basic. This can be added to the HTMLElement prototype.
//
// 1. [value]
// 2. the .value property of the prototype/element type definition
// 3. .outerHTML
function basicElementValue(el) {
  if (el.hasAttribute("value"))
    return el.getAttribute("value");  //todo if the value attr is a number, should we turn that into a number??
  if ("value" in Object.getPrototypeOf(el))
    return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").get.call(el);
  return el.outerHTML;
}

//An extended .value property adds the [src] attribute to the lightDom checks, and
// also uses the childrenWithName fallback before the outerHTML:
//
// 1. [value]
// 2. [src]
// 3. the .value property of the prototype/element type definition
// 4. [...children[name]]
// 5. outerHTML
function extendedElementValue(el) {
  if (el.hasAttribute("value"))
    return el.getAttribute("value");
  if (el.hasAttribute("src"))
    return el.getAttribute("src");
  if ("value" in Object.getPrototypeOf(el))
    return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").get.call(el);
  const childrenWithName = [...el.children].map(c => c.getAttribute("name")).filter(s => s);
  return childrenWithName.length ? childrenWithName : el.outerHTML;
}

function getElements(el) {
  return el.querySelectorAll(":root > [name], :root :not([name]) [name]"); //todo test this
}

export class NameAttr extends Attr {
  upgrade() {
    const myName = this.name;

    Object.defineProperty(this.ownerElement, myName, {
      get: function getValue() {
        return this.getAttribute(myName);
      }
    });
    Object.defineProperty(this.ownerElement, "value", {
      get: function getValue() {
        return extendedElementValue(this, myName);
      }
    });   //todo this is the value attribute that we are defining.
    //the name is only used in order to control the values attribute.
  }

  remove() {
    delete this.ownerElement.value;
  }
}



function getFormData() {
  const formData = new FormData();
  for (let {name, value} of this.elements)               //todo how to handle the same name being added many times?
    formData.has(name) || formData.append(name, value);  //todo how to fix blobs??
  return formData;
}

function getUrlEncodedValues() {
  //todo are there any newlines here??
  return Object.entries(this.values).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
}


export class ValuesAttr extends Attr {
  upgrade() {
    Object.defineProperty(this.ownerElement, "elements", {get: getElements});
    Object.defineProperty(this.ownerElement, "values", {get: getValues});
    Object.defineProperty(this.ownerElement, "formData", {get: getFormData});
  }

  remove() {
    delete this.ownerElement.elements;
    delete this.ownerElement.values;
    delete this.ownerElement.formData;
  }
}