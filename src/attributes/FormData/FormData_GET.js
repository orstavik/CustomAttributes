async function getFetch(url) {
  const res = await fetch(url, {method: "GET"});
  if (res.status >= 200 && res.status < 300)
    return res;
  //todo here it is possible to manage res.status 3xx. For example.
  throw `Failed to fetch "${url.href}": ${res.status} ${res.statusText}.`
}

function dispatchAsyncErrorEvent(target, error) {
  const e = new ErrorEvent("error", {bubbles: true, composed: true, error});
  e.defaultAction = _ => console.error(error);
  target.dispatchEvent(e);
}

function formDataToEncodedUri(href, formData) {
  const url = new URL(href);
  if (!formData)
    return url;
  for (let [k, v] of formData.entries()) {
    if (!(v instanceof String) && typeof v !== "string")
      throw TypeError("FormData with File/Blob entities cannot be encoded to uriComponent.");
    url.searchParams.set(k, v);
  }
  return url;
}

function FormData_GET(returnType) {
  return class FormData_GET extends Attr {
    upgrade() {
      this._eventType = this.name.match(/[^:-]+/)[0];
    }

    async onEvent({detail: formData}) {
      const url = formDataToEncodedUri(this.value, formData);
      try {
        const detail = await (await getFetch(url))[returnType]();
        this.ownerElement.dispatchEvent(new CustomEvent(this._eventType, {bubbles: true, composed: true, detail}));
      } catch (err) {
        const target = this.ownerElement.isConnected ? this.ownerElement : window;
        dispatchAsyncErrorEvent(target, `${this.name}: ${err}`);
      }
    }
  }
}

export const FormData_GET_json = FormData_GET("json");
export const FormData_GET_text = FormData_GET("text");

export class FormData_History extends Attr {
  async onEvent({detail: formData}) {
    const url = formDataToEncodedUri(this.value, formData);
    history.pushState(null, null, url.href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

function FormData_open_GET(target) {
  return class FormData_open_GET extends Attr {
    onEvent({detail: formData}) {
      const url = formDataToEncodedUri(this.value, formData);
      window.open(url, target);
    }
  }
}

export const FormData_open_GET_self = FormData_open_GET("_self");
export const FormData_open_GET_blank = FormData_open_GET("_blank");
export const FormData_open_GET_parent = FormData_open_GET("_parent");
export const FormData_open_GET_top = FormData_open_GET("_top");