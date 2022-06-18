function throwAsyncError(err) {
  const event = new Event("error", err);
  event.defaultAction = _ => console.error(err);
  window.dispatchEvent(event);
}

const customAttributesImpl = {};
const syncAttrs = {};
const notUpgradedAttr = [];         //todo make into an array of WeakRef
window.customAttributes = {};
Object.defineProperty(window.customAttributes, "define", {
  value: function (key, constructor, options) {
    if (customAttributesImpl[key])
      throw new Error(key + " already defined");
    customAttributesImpl[key] = constructor.prototype;
    if (options?.sync) syncAttrs[key] = constructor.prototype;          //todo remove the .prototype here.
    for (let at of notUpgradedAttr)
      upgradeClass(at)
  }
});

function upgradeClass(at) {
  if (at.constructor !== Attr)
    return;
  const definition = customAttributesImpl[at.name] ??= defineCompoundAttribute(at.name)
  if (!definition)
    return;
  try {
    Object.setPrototypeOf(at, definition.prototype);
    at.upgrade && at.upgrade();
  } catch (err) {
    throwAsyncError(err);
  }
}

function defineCompoundAttribute(name) {
  const compound = name.match(/([^-]+)-(.+)/);
  if (!compound)
    return;
  const [_, atName, eventName] = compound;
  const def = customAttributesImpl[atName];
  if (def) {
    const sync = syncAttrs[atName];
    const CustomAttr = def.constructor;
    return class CompoundAttribute extends CustomAttr {
      upgrade() {
        super.upgrade && super.upgrade();
        //todo make the this._listener stored in a WeakMap. and should we make the e.defaultAction in a method on this element?
        this._listener = sync ?
          e => this.onEvent(e) :
          e => e.defaultAction = _ => this.onEvent(e);
        this.ownerElement.addEventListener(eventName, this._listener);
      }

      remove() {
        this.ownerElement.removeEventListener(eventName, this._listener);
        super.remove && super.remove();
      }
    }
  }
  //else
  // todo with unknown definition, we can turn it simply into a call on the method
  //  with the same name on the element? be turned into method calls on the element??
}

ElementObserver.end(el => {
  for (let at of el.attributes) {
    upgradeClass(at);
    at.constructor === Attr && notUpgradedAttr.push(at);
  }
});