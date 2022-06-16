import {getNames, getValue} from "./name_conventions.js";

export class GETAttr extends Attr {
  onEvent(e) {
    open(this.value, "_self");
  }
}

export class GET_blankAttr extends Attr {
  onEvent(e) {
    open(this.value, "_blank");
  }
}

export class GET_topAttr extends Attr {
  onEvent(e) {
    open(this.value, "_top");
  }
}

export class GET_parentAttr extends Attr {
  onEvent(e) {
    open(this.value, "_parent");
  }
}

export class GETAttrWithValues extends Attr {
  onEvent(e) {
    const url = new URL(this.value);
    url.search = new URLSearchParams([...getNames(this.ownerElement)].map(c => [c.getAttribute("name"), getValue(c)]));
    open(url.href);
  }
}