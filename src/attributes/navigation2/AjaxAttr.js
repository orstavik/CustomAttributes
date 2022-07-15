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

//receives: [ [key, value], [key2, value2], [key, value2] ]. An entry map.

function GETAttr(returnType = "_self") {
  return class AjaxAttr extends Attr {
    onEvent({detail: entries}) {
      const url = new URL(this.value, location);
      if (entries)
        for (let [k, v] of entries)
          url.searchParams.set(k, v);
      if (returnType === "text" || returnType === "json")
        doFetchAndEvents(this.ownerElement, url, null, "GET", returnType);
      else if (["_self", "_blank", "_parent", "_top"].includes(returnType))
        open(url, returnType);
      else if (returnType === "history")
        history.pushState({}, null, url), window.dispatchEvent(new Event("popstate"));
    }
  }
}

function POSTFormDataAttr(returnType) {             //formdata is only useful for POST
  return class AjaxAttr extends Attr {
    onEvent({detail: entries}) {
      const url = new URL(this.value);
      const formData = new FormData();
      for (let [name, value] of entries)
        formData.append(name, value);
      for (let [k, v] of url.searchParams)
        formData.append(k, v);
      for (let k of url.searchParams.keys())
        url.searchParams.delete(k);
      doFetchAndEvents(this.ownerElement, url, formData, "POST", returnType);
    }
  }
}

function POSTUrlEncodedAttr(returnType) {
  return class AjaxAttr extends Attr {
    onEvent({detail: entries}) {
      const url = new URL(this.value);
      for (let [k, v] of entries)
        url.searchParams.set(k, v);
      const body = url.searchParams.toString();
      for (let k of url.searchParams.keys())
        url.searchParams.delete(k);
      doFetchAndEvents(this.ownerElement, url, body, "post", returnType);
    }
  }
}

//method_target_enctype_Attr

export const GET_Attr = GETAttr();
export const GET_text_Attr = GETAttr("text");
export const GET_json_Attr = GETAttr("json");
export const GET_history_Attr = GETAttr("history");
export const GET__blank_Attr = GETAttr("_blank");
export const GET__parent_Attr = GETAttr("_parent");
export const GET__top_Attr = GETAttr("_top");

export const POST_text_formdata_Attr = POSTFormDataAttr("text");
export const POST_json_formdata_Attr = POSTFormDataAttr("json");

export const POST_text_uriComponent_Attr = POSTUrlEncodedAttr("text");
export const POST_json_uriComponent_Attr = POSTUrlEncodedAttr("json");