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

export class ReAttr extends Attr {
  onEvent(e) {
    const target = querySelectorInDocuments(getRootsTopDown(this.ownerElement), this.value);
    target.dispatchEvent(cloneEvent(e, e.type, this.ownerElement));
  }
}