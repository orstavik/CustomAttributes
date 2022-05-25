import {UniversalAttribute, throwAsyncError} from "./UniversalAttribute.js";

const customAttributesImpl = {};
window.customAttributes = {};
Object.defineProperty(window.customAttributes, "define", {
  value: function (key, constructor) {
    if (customAttributesImpl[key])
      throw new Error(key + " already defined");
    customAttributesImpl[key] = constructor.prototype;
  }
});

export function upgradeAttributes(...elems) {
  for (let el of elems) {
    for (let at of el.attributes) {
      if (at.constructor !== Attr)
        continue;
      const definition = (customAttributesImpl[at.name] ??= UniversalAttribute(at.name)?.prototype);
      if (!definition)
        continue;
      try {
        Object.setPrototypeOf(at, definition);
        at.upgrade();
      } catch (err) {
        throwAsyncError(err);
      }
    }
  }
}