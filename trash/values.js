//this is impossible: this.querySelectorAll(":root > [name], :root :not([name]) [name]")
function* _getElementsImpl(el) {
  for (let child of el.children)
    child.hasAttribute("name") ? yield child : yield* _getElementsImpl(child);
}

function getElements() {
  return _getElementsImpl(this);
}

function getFormData() {
  const formData = new FormData();
  for (let {name, value} of this.elements) //entries with the same [name] can be added many times.
    formData.append(name, value);
  //todo I need to get the file from the <input type=file> and from <img>? These are blobs. How to do this here?
  //todo we need the type of the value here.. we need to do new Blob(<img>.data, <img>.mime) or something like this.
  //todo how do we do that.
  //todo if we have an <input type=file>, then we need to do the .value and make it return a blob? or an array of blobs? How do the formData process the blob?
  return formData;
}

function getUrlData() {
  return [...this.elements].map(({name, value}) => `${name}=${encodeURIComponent(value)}`).join("&");
}

export class ValuesAttr extends Attr {
  upgrade() {
    Object.defineProperty(this.ownerElement, "elements", {get: getElements});
    Object.defineProperty(this.ownerElement, "urlData", {get: getUrlData});
    Object.defineProperty(this.ownerElement, "formData", {get: getFormData});
    Object.defineProperty(this.ownerElement, "values", {get: this.value === "formData" ? getFormData : getUrlData});
  }

  remove() {
    delete this.ownerElement.elements;
    delete this.ownerElement.formData;
    delete this.ownerElement.urlData;
    delete this.ownerElement.values;
  }
}