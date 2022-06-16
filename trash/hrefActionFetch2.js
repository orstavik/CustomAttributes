function ConstrainAttr(list) {
  return class ConstrainAttr extends Attr {
    upgrade() {
      this._mo = new MutationObserver(mrs => {
        for (let {target, attributeName} of mrs) {
          if (list.indexOf(target.getAttribute(attributeName).toLowerCase()) < 0) {
            target.removeAttribute(attributeName);
            throw "illegal enctype attribute value: " + value;
          }
        }
      });
      this._mo.observe(this.ownerElement, {attributeFilter: [this.name]});
    }

    remove() {
      this._mo.disconnect();
    }
  }
}

customAttributes.define("enctype", ConstrainAttr(["", "application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]));
customAttributes.define("method", ConstrainAttr(["", "post", "get"]));
customAttributes.define("target", ConstrainAttr(["", "_self", "_blank", "_top", "_parent"]));


// //The [name] attribute creates a .value getter on the ownerElement.
// //the .value reflects:
// // 1. [value]
// // 2. [src]
// // 3. the .value of the prototype
// // 4. [...children[name]]
// class NameAttr extends Attr {
//   upgrade() {
//     Object.defineProperty(this.ownerElement, "value", {
//       get: function getValue() {
//         if (this.hasAttribute("value"))
//           return this.getAttribute("value");
//         if (this.hasAttribute("src"))
//           return this.getAttribute("value");
//         //todo how should this work, should I look for the .value on the prototype??
//         // if("value" in Object.getPrototypeOf(this))
//         //   return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "value").get.call(this);
//         if (!this.children.length)
//           return this.innerText;
//         const res = [];
//         for (let child of this.children)
//           res.push(this.getAttribute("name"));
//         return res;
//       }
//     });
//   }
//
//   remove() {
//     delete this.ownerElement.value;
//   }
// }
//
// customAttributes.define("name", NameAttr);

function openViaTemporaryForm(href, target, enctype, elements) {
  var form = document.createElement("form");
  form.target = target;
  form.method = "POST";
  form.action = href;
  form.enctype = enctype;
  form.style.display = "none";

  for (let el of elements) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = el.getAttribute("name");
    input.value = el.value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function navigate() {
  let href = this.getAttribute("action");
  const target = this.getAttribute("target") || "_self";
  const enctype = this.getAttribute("enctype")?.toLowerCase();

  if (this.getAttribute("method")?.toLowerCase() === "post")
    openViaTemporaryForm(href, target, enctype, this.elements);

  //defaults to method="get"
  if (enctype === "application/x-www-form-urlencoded")
    href += "?" + Object.entries(this.values).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  window.open(href, target);
}

//todo make this return a querySelectorAll directly.
function getElements() {
  const withName = this.querySelectorAll("[name]");
  return [...withName].filter((el, i, ar) => (el.value !== undefined && ar.indexOf(el) === i));
}

//todo if this returns a set of entries, then it is almost unnecessary.
function getValues() {
  return Object.fromEntries(this.elements.map(el => [el.getAttribute("name"), el.value]));
  const res = {};
  for (let el of this.elements)
    res[el.getAttribute("name")] = el.value;
  return res;
}

//elements => becomes [names] , and [action] demands the use of [names] will require the use of the [names] on the element as well.

class ActionAttr extends Attr {
  upgrade() {
    Object.defineProperty(this.ownerElement, "elements", {get: getElements});
    Object.defineProperty(this.ownerElement, "values", {get: getValues});
    Object.defineProperty(this.ownerElement, "navigate", {value: navigate});
    this.ownerElement.setAttribute("do-submit", "navigate");
  }

  remove() {
    delete this.ownerElement.elements;
    delete this.ownerElement.values;
    delete this.ownerElement.navigate;
    this.ownerElement.removeAttribute("do-submit");
  }
}

customAttributes.define("action", ActionAttr);


async function ajaxFetch() {
  //method defaults and errors to post, but can be set to "get"
  const method = this.getAttribute("method") || "post";
  const enctype = this.getAttribute("enctype") || "multipart/form-data";
  let href = this.getAttribute("ajax");
  if (method === "get" && enctype === "application/x-www-form-urlencoded")
    href += "?" + Object.entries(this.values).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  const body = method === "post" ? this.formData : undefined;
  try {
    const res = await fetch(href, {body, method});
    const eventType = res.status >= 200 && res.status < 300 ? "load" : "error";
    this.dispatchEvent(new CustomEvent(eventType, {bubbles: true, composed: true, details: res}));
  } catch (err) {
    this.dispatchEvent(new CustomEvent("error", {bubbles: true, composed: true, details: err}));
  }
}

function getFormData() {
  let enctype = this.getAttribute("enctype")?.toLowerCase(); //todo this needs manual treatment
  if (enctype === "application/x-www-form-urlencoded") {
    //todo are there any newlines here??
    return Object.entries(this.values).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  }
  if (enctype === "text/plain")
    throw new Error("not yet implemented");
  //otherwise default to
  const formData = new FormData();
  for (let input of this.elements)
    formData.append(input.getAttribute("name"), input.value);//todo fix blobs
  return formData;
}
                                                                    //values=formData  //values=json  //values=urlencoded //values
                                                                    //.elements  when values is added, then we get the .elements.
                                                                    //values adds all the different types, but is sets the default .values to be a particular type
                                                                    //submit to the fetch or whatever, then we let the submit event use the default .values,
                                                                    //and then the values=formData or whatever is set from the values.
class AjaxAttr extends Attr {
  upgrade() {
    Object.defineProperty(this.ownerElement, "elements", {get: getElements});
    Object.defineProperty(this.ownerElement, "values", {get: getValues});
    Object.defineProperty(this.ownerElement, "formData", {get: getFormData});
    Object.defineProperty(this.ownerElement, "fetch", {value: ajaxFetch});
    this.ownerElement.setAttribute("do-submit", "fetch");
  }

  remove() {
    delete this.ownerElement.elements;
    delete this.ownerElement.values;
    delete this.ownerElement.formData;
    delete this.ownerElement.fetch;
    this.ownerElement.removeAttribute("do-submit");
  }
}

customAttributes.define("ajax", AjaxAttr);