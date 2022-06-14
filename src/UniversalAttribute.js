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

export function throwAsyncError(err) {
  const event = new Event("error", err);
  window.dispatchEvent(event); //todo don't fully remember how to do this one.
  runDefaultAction(event, _ => console.error(err));
}

function currentTargetAndUpLighterDomOnly(path, ownerElement) {
  let ancestorElementsInComposedPath = path.slice(path.indexOf(ownerElement));
  let res = [], document, targetDocument = ownerElement.getRootNode();
  for (let el of ancestorElementsInComposedPath) {
    //all slotting elements are excluded, but not a slot in the same document as the target. Fallback nodes are ok.
    if (el instanceof HTMLSlotElement && el.getRootNode() !== targetDocument)
      document = el.getRootNode();
    else if (document) {
      if (el === document)
        document = undefined;
    } else
      res.push(el);
  }
  return res;
}

export function UniversalAttribute(name) {
  const regex = /(on|once|re|do|co|at|no|attr|log|debugger)-(.+)/;
  const [_, type, eventName] = name.match(regex) || [];
  if (!type)
    return;
  return class UniversalAttribute extends Attr {

    upgrade() {
      this._listener = e => {
        if (["on", "once", "no"].includes(type))
          this[type](e);                                               //todo this async behavior could be syntactified..
        else                                                           //todo such that :on-click is a sync reaction, while on-click is an async default action.
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

    log(e) {
      console.log(e);
    }

    debugger(e) {
      console.log(e);
      console.log(e.currentTarget);
      debugger;
    }

    attr(e) {
      const [_, atName, _2, propName, _3, query] = this.value.match(/([^=]+)(=([^=]*))(=>(.*))?/);
      const path = currentTargetAndUpLighterDomOnly(e.composedPathFixed, this.ownerElement);
      //remove elements between <slot> and document
      //filter away, so that if a parent element is a <slot>, then we must skip all the other elements up to and including that slot elements document.
      const target = findNearestParentMatching(path, query);
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