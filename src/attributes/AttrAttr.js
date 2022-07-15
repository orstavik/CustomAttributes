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

export class AttrAttr extends Attr {
  onEvent(e) {
    const [_, atName, _2, propName, _3, query] = this.value.match(/([^=]+)(=([^=]*))(=>(.*))?/);
    const path = currentTargetAndUpLighterDomOnly(e.composedPath(), this.ownerElement);
    //remove elements between <slot> and document
    //filter away, so that if a parent element is a <slot>, then we must skip all the other elements up to and including that slot elements document.
    const target = findNearestParentMatching(path, query);
    if (!propName)
      target.hasAttribute(atName) ? target.removeAttribute(atName) : target.setAttribute(atName, "");
    else
      target.setAttribute(atName, this.ownerElement[propName]);
  }
}