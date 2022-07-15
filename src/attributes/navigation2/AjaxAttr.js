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

function GETAttr(returnType = "text") {
  return class AjaxAttr extends Attr {
    onEvent({detail: entries}) {
      const url = new URL(this.value);
      for (let [k, v] of entries)
        url.searchParams.set(k, v);
      doFetchAndEvents(this.ownerElement, url, null, "GET", returnType);
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
      doFetchAndEvents(this.ownerElement, this.value, formData, "POST", returnType);
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

export const GET_Attr = GETAttr();
export const GET_Attr_json = GETAttr("json");

export const POST_formdata_Attr = POSTFormDataAttr();
export const POST_formdata_Attr_json = POSTFormDataAttr("json");

export const POST_uriComponent_Attr = POSTUrlEncodedAttr();
export const POST_uriComponent_Attr_json = POSTUrlEncodedAttr("json");