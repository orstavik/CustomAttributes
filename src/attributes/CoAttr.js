function getTargets(node) {
  const res = [node];
  let next = node;
  while (next = next.getRootNode()?.host)
    res.unshift(next);
  return res;
}

export class CoAttr extends Attr {
  onEvent(e) {
    const relatedTarget = e.relatedTarget;
    const clone = new e.constructor(this.value, e);
    Object.defineProperty(clone, "relatedTarget", {
      get() {  //todo this leaks elements out of closed shadowDoms
        return relatedTarget;
      }
    });
    Object.defineProperty(clone, "relatedTargetQueries", {
      get() {
        return getTargets(relatedTarget).map(el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : ""));
      }
    });
    return clone;
  }
}