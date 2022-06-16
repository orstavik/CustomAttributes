import {getNames, getValue} from "./name_conventions.js";

//todo do we want to do something with the state argument other than null?
// The problem here is that it is hidden in the JS landscape, which is bad.
// My thinking is that we don't want secret JS state, and therefore we should set it to null always.

export class Pushstate_values_Attr extends Attr {
  onEvent(e) {
    const url = new URL(this.value);
    url.search = new URLSearchParams([...getNames(this.ownerElement)].map(c => [c.getAttribute("name"), getValue(c)]));
    history.pushState({}, "", url);
  }
}

export class PushstateAttr extends Attr {
  onEvent(e) {
    history.pushState({}, "", this.value);
  }
}