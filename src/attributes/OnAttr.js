function runMethods(at, e, target) {
  for (let method of at.value.split(" ")) {
    try {
      if (!(method in target))
        throw `'.${method}' is not a function on element <${target.tagName}>. Is it a typo?`;
      target[method](e);
    } catch (err) {
      const event = new ErrorEvent(err);
      event.defaultAction = _ => console.error(err);
      window.dispatchEvent(event); //todo we need to queue it using nextTick. audioRatechange
    }
  }
}

export class OnAttr extends Attr {
  onEvent(e) {
    runMethods(this, e, this.ownerElement);
  }
}

export class OnceAttr extends Attr {
  onEvent(e) {
    runMethods(this, e, this.ownerElement);
    this.remove();
  }
}

export class OnHostAttr extends Attr {
  onEvent(e) {
    runMethods(this, e, this.ownerElement.getRootNode().host);
  }
}

export class OnceHostAttr extends Attr {
  onEvent(e) {
    runMethods(this, e, this.ownerElement.getRootNode().host);
    this.remove();
  }
}

export class OnParentAttr extends Attr {
  onEvent(e) {
    runMethods(this, e, this.ownerElement.parentNode);
  }
}

export class OnceParentAttr extends Attr {
  onEvent(e) {
    runMethods(this, e, this.ownerElement.parentNode);
    this.remove();
  }
}