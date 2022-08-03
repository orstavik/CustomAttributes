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

export class CoAttr extends Attr {
  onEvent(e) {
    return cloneEvent(e, this.value);
  }
}