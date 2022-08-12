function throwAsyncError(err) {
  const event = new Event("error", err);
  event.defaultAction = _ => console.error(err);
  window.dispatchEvent(event);
}

const customAttributesImpl = {};
let notUpgradedAttr = [];         //todo make into an array of WeakRef
window.customAttributes = {};
Object.defineProperty(window.customAttributes, "define", {
  value: function (key, constructor) {
    if (customAttributesImpl[key])
      throw new Error(key + " already defined");
    customAttributesImpl[key] = constructor;
    const notUpgraded = notUpgradedAttr.slice();
    notUpgradedAttr = [];
    for (let at of notUpgraded)
      upgradeClass(at)
  }
});

function upgradeClass(at) {
  const CustomAttr = customAttributesImpl[at.name] ??= defineCompoundAttribute(at.name);
  if (!CustomAttr)
    return notUpgradedAttr.push(at);
  try {
    Object.setPrototypeOf(at, CustomAttr.prototype);
    at.upgrade?.();
    at.onChange?.();
  } catch (err) {
    throwAsyncError(err);
  }
}

//todo when we make a compound attribute,
// then we make an Attr class that will have the list of attributes as its static content.
// then, on upgrade, it will make a series of children attribute objects. The problem is that these attribute objects
// will not be on the main element. They don't have the .ownerElement nor nothing on themselves.
// to fix this issue, we can implement the customAttributes as a mixin function instead. Not sure I super-like this.

function defineCompoundAttribute(name) {
  const compound = name.match(/(:?)([^-]+)-(.+)/);
  if (!compound)
    return;
  const [_, sync, atName, eventName] = compound;
  const CustomAttr = customAttributesImpl[atName];
  let listener;
  if (CustomAttr && sync) {
    return class CompoundAttribute extends CustomAttr {
      upgrade() {
        super.upgrade?.();
        this.ownerElement.addEventListener(eventName, listener = e => this.onEvent(e));
      }

      onEvent(e) {
        const outputEvent = super.onEvent(e);
        if (outputEvent && !e.defaultPrevented)
          console.warn("an output event is ignored by an observing custom attribute: " + outputEvent.type);
      }

      remove() {
        this.ownerElement.removeEventListener(eventName, listener);
        super.remove?.();
      }
    };
  } else if (CustomAttr) {
    return class CompoundAttribute extends CustomAttr {
      upgrade() {
        super.upgrade?.();
        this.ownerElement.addEventListener(eventName, listener = e => e.defaultAction = e => this.onEvent(e));
      }

      onEvent(e) {
        const outputEvent = super.onEvent(e);
        if (outputEvent && outputEvent !== e && !e.defaultPrevented)
          this.ownerElement.dispatchEvent(outputEvent);
      }

      remove() {
        this.ownerElement.removeEventListener(eventName, listener);
        super.remove?.();
      }
    };
  }
  //else
  // todo with unknown definition, we can turn it simply into a call on the method
  //  with the same name on the element? be turned into method calls on the element??
  // todo NO! if we want to do this, then we need to mark this syntactically I think. If not, there will be naming overlaps in big applications.
}

ElementObserver.end(el => {
  for (let at of el.attributes)
    upgradeClass(at);
});

function deprecate(name) {
  return function deprecated() {
    throw `${name}() is deprecated`;
  }
}

// Monkeypatch Attr. only setAttribute, getAttribute and removeAttribute (and in template) works.
// The .attributes gives a fallback method to access the Attr objects from JS.
(function (getAttrOG, setAttrOG, removeAttrOG, getAttrNodeOG, documentCreateAttributeOG, setAttributeNodeOG) {
  Element.prototype.hasAttributeNS = deprecate("Element.hasgetAttributeNS");
  Element.prototype.getAttributeNS = deprecate("Element.getAttributeNS");
  Element.prototype.setAttributeNS = deprecate("Element.setAttributeNS");
  Element.prototype.removeAttributeNS = deprecate("Element.removeAttributeNS");
  Element.prototype.getAttributeNode = deprecate("Element.getAttributeNode");
  Element.prototype.setAttributeNode = deprecate("Element.setAttributeNode");
  Element.prototype.removeAttributeNode = deprecate("Element.removeAttributeNode");
  Element.prototype.getAttributeNodeNS = deprecate("Element.getAttributeNodeNS");
  Element.prototype.setAttributeNodeNS = deprecate("Element.setAttributeNodeNS");
  Element.prototype.removeAttributeNodeNS = deprecate("Element.removeAttributeNodeNS");
  document.createAttribute = deprecate("document.createAttribute");

  Element.prototype.setAttribute = function (name, value) {
    if (this.hasAttribute(name)) {
      const at = getAttrNodeOG.call(this, name);
      const oldValue = getAttrOG.call(this, name);
      if (value !== undefined)
        at.value = value;
      at.onChange?.(oldValue);
    } else {
      const at = documentCreateAttributeOG.call(document, name);
      if (value !== undefined)
        at.value = value;
      setAttributeNodeOG.call(this, at);
      upgradeClass(at);
    }
  };
  Element.prototype.removeAttribute = function (name) {
    getAttrNodeOG.call(this, name)?.remove?.();
    removeAttrOG.call(this, name);
  };
})(Element.prototype.getAttribute, Element.prototype.setAttribute, Element.prototype.removeAttribute, Element.prototype.getAttributeNode, document.createAttribute, Element.prototype.setAttributeNode);