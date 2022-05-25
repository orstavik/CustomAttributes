function nextTick(cb) {
  const audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
}

//todo the defaultActions now use e.defaultPrevented + nextTick + e.preventDefautl() and action().
// 1. this ensures that only the first default action added for an event runs.
// 2. but this is inefficient. We should queue the default action directly on the event, so not to queue and trigger lots of ratechangeTick functions unnecessary. This require an Event.setDefaultAction() that is globally available to all custom Attributes, which currently isn't implemented.
function runDefaultAction(e, cb) {
  if (e.defaultPrevented)
    return;
  e.composedPathFixed = e.composedPath();
  //todo the composedPath is lost for the default action. That is not good. We need to fix it.
  nextTick(() => (!e.defaultPrevented && e.preventDefault() || cb()));
}

function getRootsTopDown(target) {
  const roots = [];
  for (let root = target.getRootNode(); root; root = root.host?.getRootNode())
    roots.unshift(root);
  return roots;
}

function querySelectorInDocuments(roots, query) {
  for (let topDownRoot of roots) {
    const dialog = topDownRoot.querySelector(query);
    if (dialog)
      return dialog;
  }
}

function getTargets(node) {
  const res = [node];
  let next = node;
  while (next = next.getRootNode()?.host)
    res.unshift(next);
  return res;
}

function cloneEvent(e, type, relatedTarget = e.relatedTarget) {
  const event = new e.constructor(type, e);
  Object.defineProperty(event, "relatedTarget", {
    get() {  //todo this leaks elements out of closed shadowDoms
      return relatedTarget;
    }
  });
  Object.defineProperty(event, "relatedTargetQueries", {
    get() {
      return getTargets(relatedTarget).map(el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : ""));
    }
  });
  return event;
}

//todo different version of this for mouseEvents and for keyboard events.
//1 is good, 0 is mismatch, -1 is irrelevant
function metaKeyGood(k, e) {
  k = k.toLowerCase();
  return !["shift", "alt", "ctrl", "meta"].includes(k) ? -1 : +e[k + "Key"];
}

//numbers are checked against e.buttons
function mouseKeysMissing(whitelist) {
  return function (e) {
    for (let key of whitelist) {
      const validMeta = metaKeyGood(key, e);
      if (validMeta === 1) continue;
      if (validMeta === 0) return false;
      //validMeta === -1, so we must try something else
      if (key.match(/\d/) && e.buttons !== parseInt(key))
        return true;
    }
  }
}

function keyboardKeysMissing(whitelist) {
  return function (e) {
    for (let key of whitelist) {
      const validMeta = metaKeyGood(key, e);
      if (validMeta === 1) continue;
      if (validMeta === 0) return true;
      //validMeta === -1, so we must try something else
      if (key === "space" && e.key !== " ")
        return true;
      if (/[\w\d]+/.exec(key) && !e.key.match(key))  //todo exactly what format here?
        return true;
    }
  }
}

//todo we are essentially making a filter/map for whitelist/matching against an event.
//todo this is done before. find out good examples of others that have done it.
function makeEventFilter(eventName, whitelist) {
  //todo mouse is mouse- pointer- click auxclick contextmenu
  return eventName.startsWith("key") ? keyboardKeysMissing(whitelist) : mouseKeysMissing(whitelist);
}

function atomicHostsOnly(path) {
  let slots = 0;
  return path.filter((el, i) => {
    if (el instanceof HTMLSlotElement)
      slots++;
    else if (i && path[i - 1] instanceof ShadowRoot) {
      if (slots === 0)
        return true;
      slots--;
    }
  });
}

function stripAncestorType(query) {
  query = query.trim();
  if (!query)
    return {type: "all", query: "*"};
  let [_, type, _2, query2 = "*"] = query.match(/:(root|parent|host)(\((.*)\))?/) || [];
  return type ? {type, query: query2} : {query};
}

function findNearestParentMatching(path, queryOG) {
  let {type, query} = stripAncestorType(queryOG);
  path = type === "root" ? [path[0]] :
    type === "parent" ? [path[1]] :
      type === "host" ? atomicHostsOnly(path) :
        path;
  return path.find(el => el.matches(query));
}

function throwAsyncError(err) {
  const event = new Event("error", err);
  window.dispatchEvent(event); //todo don't fully remember how to do this one.
  runDefaultAction(event, _ => console.error(err));
}

function UniversalAttribute(name) {
  const regex = /(on|once|re|do|co|at|no|attr)-([^_]+)(_(.+))?/;
  const [_, type, eventName, __, filter] = name.match(regex) || [];
  if (!type)
    return;
  const eventFilter = filter && makeEventFilter(eventName, filter.split("-"));
  return class UniversalAttribute extends Attr {

    upgrade() {
      this._listener = e => {
        if (eventFilter && eventFilter(e))
          return;
        if (["on", "once", "no"].includes(type))
          this[type](e);
        else
          runDefaultAction(e, _ => this[type](e));
      };
      this.ownerElement.addEventListener(eventName, this._listener);
    }

    //todo this is not strictly enforced yet.
    remove() {
      this.ownerElement.removeEventListener(eventName, this._listener);
      this.ownerElement.removeAttributeNode(this);
    }

    on(e) {
      for (let method of this.value.split(" ")) {
        try {
          if (!(method in this.ownerElement))
            throw `'.${method}' is not a function on element <${this.ownerElement.tagName}>. Is it a typo?`;
          this.ownerElement[method](e);
        } catch (err) {
          throwAsyncError(err);
        }
      }
    }

    once(e) {
      this.on(e);
      this.remove();
    }

    no(e) {
      e.preventDefault();
    }

    attr(e) {
      const [_, atName, _2, propName, _3, query] = this.value.match(/([^=]+)(=([^=]*))(=>(.*))?/);
      const path = e.composedPathFixed;
      const target = findNearestParentMatching(path.slice(path.indexOf(this.ownerElement)), query);
      if (!propName)
        target.hasAttribute(atName) ? target.removeAttribute(atName) : target.setAttributeNode(document.createAttribute(atName));
      else
        target.setAttribute(atName, this.ownerElement[propName]);
    }

    at() {
      this.ownerElement.hasAttribute(this.value) ?
        this.ownerElement.removeAttribute(this.value) :
        this.ownerElement.setAttributeNode(document.createAttribute(this.value));
    }

    co(e) {     //todo rename to to-?
      this.ownerElement.dispatchEvent(cloneEvent(e, this.value));
    }

    re(e) {                  //todo rename to cc-
      const target = querySelectorInDocuments(getRootsTopDown(this.ownerElement), this.value);
      target.dispatchEvent(cloneEvent(e, e.type, this.ownerElement));
    }

    do(e) {
      this.on(e);
    }
  }
}

//!!!customAttributes!!!

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