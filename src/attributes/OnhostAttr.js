function runMethods(at, e) {
  for (let method of at.value.split(" ")) {
    try {
      let el = at.ownerElement.getRootNode().host;
      if (!(method in el))
        throw `'.${method}' is not a function on the element's host <${el.tagName}>. Is it a typo?`;
      el[method](e);
    } catch (err) {
      const event = new Event("error", err);
      event.defaultAction = _ => console.error(err);
      window.dispatchEvent(event); //todo don't fully remember how to do this one.
    }
  }
}

export class OnhostAttr extends Attr {
  onEvent(e) {
    runMethods(this, e);
  }
}

export class OncehostAttr extends Attr {
  onEvent(e) {
    runMethods(this, e);
    this.remove();
  }
}