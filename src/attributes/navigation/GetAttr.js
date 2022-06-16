import {getNames, getValue} from "./name_conventions.js";

function GetAttr(target, values) {
  if (values) {
    return class GETAttr extends Attr {
      onEvent(e) {
        const url = new URL(this.value);
        url.search = new URLSearchParams([...getNames(this.ownerElement)].map(c => [c.getAttribute("name"), getValue(c)]));
        open(url.href, target);
      }
    }
  }
  return class GETAttr extends Attr {
    onEvent(e) {
      open(this.value, target);
    }
  }
}

export const GET_self_Attr = GetAttr("_self");
export const GET_self_values_Attr = GetAttr("_self", true);
export const GET_blank_Attr = GetAttr("_blank");
export const GET_blank_values_Attr = GetAttr("_blank", true);
export const GET_parent_Attr = GetAttr("_parent");
export const GET_parent_values_Attr = GetAttr("_parent", true);
export const GET_top_Attr = GetAttr("_top");
export const GET_top_values_Attr = GetAttr("_top", true);