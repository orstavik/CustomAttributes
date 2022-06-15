function runMethods(at, e) {
  for (let method of at.value.split(" ")) {
    try {
      if (!(method in at.ownerElement))
        throw `'.${method}' is not a function on element <${at.ownerElement.tagName}>. Is it a typo?`;
      at.ownerElement[method](e);
    } catch (err) {
      const event = new Event("error", err);
      event.defaultAction = _ => console.error(err);
      window.dispatchEvent(event); //todo don't fully remember how to do this one.
    }
  }
}

export class OnAttr extends Attr {
  onEvent(e) {
    runMethods(this, e);
  }
}

export class OnceAttr extends Attr {
  onEvent(e) {
    runMethods(this, e);
    this.remove();
  }
}