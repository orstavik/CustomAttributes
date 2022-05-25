function nextTick(cb) {
  const audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
}

function da(e, action) {
  e.defaultPrevented || nextTick(() => (!e.defaultPrevented && e.preventDefault() || action()));
}

class HrefAttr extends Attr {
  upgrade() {
    //todo this mirrors the native href behavior
    this._clickListener = e => da(e, _ => window.open(this.value));
    this._auxclickListener = e => da(e, _ => window.open(this.value, "_blank"));
    this.ownerElement.addEventListener("click", this._clickListener);
    this.ownerElement.addEventListener("auxclick", this._auxclickListener);
  }

  remove() {
    this.ownerElement.removeEventListener("click", this._clickListener);
    this.ownerElement.removeEventListener("auxclick", this._auxclickListener);
  }
}

class ActionAttr extends Attr {
  //todo this mirrors the native action behavior
  upgrade() {
    //todo read the method
    //todo read the enc-type
    this._onSubmit = e => da(e, _ => window.open(this.value + this.query));
  }

  remove() {
    this.ownerElement.removeEventListener("click", this._clickListener);
    this.ownerElement.removeEventListener("auxclick", this._auxclickListener);
  }

  //todo the value cannot always be an attribute..
  // We need to have the value as a prop on the object. sometimes.
  //todo set the .elements on the ownerElement
  get elements() {
    // return this.ownerElement.querySelectorAll("[name][value]");
    // value is available might not be so..
    const withName = this.ownerElement.querySelectorAll("[name]");
    //todo and this cannot break past other <el with action or fetch_.. or <form or something like this.
    //the `name` is a custom attribute also.
    // It provides with marshalling of the value attribute and the .value prop getter and setter.
    return [...withName].filter((el, i, ar) => (el.value !== undefined && ar.indexOf(el) === i));
  }

  get query() {
    return "?" + [...this.elements].map(el => el.getAttribute("name") + "=" + el.getAttribute("value")).join("&");
  }
}

//reacts to click and auxclick
// `href`

//reacts to submit.
//   `fetch-...-...`

// Default is get with uri encoded data.
// uri => method POST + enctype application 
// formdata => method POST + enctype formdata
// raw => method POST + enctype text

// If one wants, one can always do your own custom attributes 
// for the other http methods or add formData and raw to GET.
//for -none, the method is none, and uri(enctype application) is also default mode.

//get
//get-blank
//get-self
//get-top
//get-parent

//ajax(-(formdata|application|text|get))?  //dispatches load/error event
//this creates (a before-fetch event) and then a fetch call and then a load/error event after the fetch completes.

//post(-(formdata|application|text))?(_self|_blank|_top|_parent)?  //this makes an openForm()

//post is a beafed up submit event creator.. or wait, it is an attribute that adds a default action for a submit event. The default action and the creation of the submit event are separated. That might be wrong.

//co-click=submit
//do-submit=navigate

//navigate => only adds a method on the ownerElement. And then this method will use the method, enctype, and target attribute.

//get(-query)?(_(self|blank|top|parent))?                          //this calls window.open()
   //get is a beafed up :href??

//post-ajax-(application|formdata|text)
//post-blank-(application|formdata|text)
//post-self-(application|formdata|text)
//post-top-(application|formdata|text)
//post-parent-(application|formdata|text)

//1. it sets and removes props such as .elements, .formdata, .nameValues, .query to the element.
//2. it listens for submit, and then turn this into an action.
//3. it looks at the target, to find the method to use for this action.
//4. for the method=post alternatives, it needs to create a <form> element temporarily.

//todo the value cannot always be an attribute.. We need to have the value as a prop on the object. sometimes.

//todo and this cannot break past other <el with action or fetch_.. or <form or something like this.
//the `name` is a custom attribute also.
// It provides with marshalling of the value attribute and the .value prop getter and setter.
function getElements() {
  const withName = this.querySelectorAll("[name]");
  //todo this logic i need to research what are radio buttons doing here?
  //todo we don't filter overlapping elements here i think..
  return [...withName].filter((el, i, ar) => (el.value !== undefined /*&& ar.indexOf(el) === i*/));
}

function getNameValuePairs() {
  const res = {};
  for (let el of this.elements) {
    const name = el.getAttribute("name");
    if (name in res)
      continue;
    const value = el.hasAttribute("value") ? el.getAttribute("value") : el.value;
    if (value !== undefined)
      res[name] = value;
  }
  return res;
}

function getHref() {
  const query = Object.entries(this.ownerElement.nameValuePairs).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  if(!query)
    return this.value;
  return this.value + "?" + query;
}

async function getFormData() {
  const res = new FormData();
  for (let [name, value] of Object.entries(this.nameValuePairs)) {
    res.append(name, value);
    //todo how to turn that value into a string, is it just the File we need to blob?
  }
  return res;
}

const elToSubmitListener = new WeakMap();

class FetchAttr extends Attr {
  upgrade(onSubmit) {
    if (onSubmit) {
      elToSubmitListener.set(this, onSubmit);
      this.ownerElement.addEventListener("submit", onSubmit);
    }
    Object.defineProperty(this.ownerElement, "elements", {get: getElements});
    Object.defineProperty(this.ownerElement, "nameValuePairs", {get: getNameValuePairs});
  }

  remove() {
    const onSubmit = elToSubmitListener.get(this);
    if (onSubmit)
      this.ownerElement.removeEventListener("submit", onSubmit);
    delete this.ownerElement.elements;
    delete this.ownerElement.nameValuePairs;
    delete this.ownerElement.formData;
  }
}

function openViaTempForm(el, url, target, enctype) {
  var form = document.createElement("form");
  form.target = target;
  form.method = "POST";
  form.action = url;
  form.enctype = enctype;
  form.style.display = "none";

  for (var [name, value] in Object.entries(el.nameValuePairs)) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = data[name];
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

async function openAjax(el, href, method, enctype) {
  const body =
    enctype === "uri" ? el.href :  //todo we need to fix the issue with the name=here..
      enctype === "formdata" ? el.formData :
        enctype === "raw" ? "todo this i don't know how to do" :
          "omg wtf";
  try {
    const resp = await ajaxFetch(href, {method, body});
    el.dispatchEvent(new Event("load", {bubbles: true, composed: true}));
  } catch (err) {
    el.dispatchEvent(new CustomEvent("error", {bubbles: true, composed: true, detail: err}));
  }
}

async function openGet(el, href, target) {
  if (target === "ajax")
    await openAjax(el, href, "GET", "uri");
  else
    window.open(href, "_" + target);
}

async function openPost(el, href, target, enctype) {
  if (target === "ajax")
    await openAjax(el, href, "POST", enctype);
  else
    openViaTempForm(el, href, "_" + target, enctype);
}

export class FetchGetAttr extends FetchAttr {
  upgrade(_, target) {
    super.upgrade(e => da(e, _ => openGet(this.ownerElement, this.ownerElement.href, target)));
    Object.defineProperty(this.ownerElement, "href", {get: getHref.bind(this)});
  }

  remove() {
    delete this.ownerElement.href;
  }
}

class FetchPostAttr extends FetchAttr {
  upgrade(_, target, enctype = "formdata") {
    super.upgrade(e => da(e, _ => openPost(this.ownerElement, this.href, target, enctype)));
    if (enctype === "formdata")
      Object.defineProperty(this.ownerElement, "formData", {get: getFormData});
    else if (enctype === "uri" || !enctype)
      Object.defineProperty(this.ownerElement, "href", {get: getHref.bind(_, this)});
  }

  remove() {
    if (this.name.endsWith("formdata"))
      delete this.ownerElement.formData;
    else if (enctype === "uri" || !enctype)    //todo enctype??
      delete this.ownerElement.href;
  }
}

//todo this should be called on the outside where the attribute definition is imported.
// customAttributes.define("href-2", HrefAttr);
// customAttributes.define("action-2", ActionAttr);
