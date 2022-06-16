import {getNames, getValue} from "./name_conventions.js";

async function doFetchAndEvents(el, url, body, method, returnType) {
  try {
    const res = await fetch(url, {body, method});
    const eventType = res.status >= 200 && res.status < 300 ? "load" : "error";
    const detail = await res[returnType]();
    el.dispatchEvent(new CustomEvent(eventType, {bubbles: true, composed: true, detail}));
  } catch (err) {
    el.dispatchEvent(new CustomEvent("error", {bubbles: true, composed: true, detail: err}));
  }
}

async function open(el, href, nameValues, method, enctype, returnType) {
  if (method === "get") {
    const url = new URL(href);
    url.searchParams = new URLSearchParams(nameValues);
    doFetchAndEvents(el, url, null, "get", returnType);
    return;
  }
  /*method === "post"*/
  if (enctype === "multipart/form-data") {
    const body = new FormData();
    for (let [k, v] of nameValues) {
      body.append(k, v);
      //todo need special handling of image data.
    }
    doFetchAndEvents(el, href, body, "post", returnType);
    return;
  }
  /* enctype  === "application/x-www-form-urlencoded" */
  //todo need special handling of image data.
  const body = nameValues.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  doFetchAndEvents(this, href, body, "post", returnType);
}

function AjaxAttr(method, enctype, returnType) {
  return class AjaxAttr extends Attr {
    onEvent(e) {
      const nameValues = [...getNames(this.ownerElement)].map(c => [c.getAttribute("name"), getValue(c)]);
      open(this.ownerElement, this.value, nameValues, method, enctype, returnType);
    }
  }
}

export const AJAX_post_urlencoded_Attr = AjaxAttr("post", "application/x-www-form-urlencoded", "json");
export const AJAX_post_formdata_Attr = AjaxAttr("post", "multipart/form-data", "json");
export const AJAX_get_urlencoded_Attr = AjaxAttr("get", "application/x-www-form-urlencoded", "json");
export const AJAX_get_formdata_Attr = AjaxAttr("get", "multipart/form-data", "json");
export const AJAX_post_urlencoded_text_Attr = AjaxAttr("post", "application/x-www-form-urlencoded", "text");
export const AJAX_post_formdata_text_Attr = AjaxAttr("post", "multipart/form-data", "text");
export const AJAX_get_urlencoded_text_Attr = AjaxAttr("get", "application/x-www-form-urlencoded", "text");
export const AJAX_get_formdata_text_Attr = AjaxAttr("get", "multipart/form-data", "text");