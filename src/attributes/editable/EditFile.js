export class ImageEditAttr extends Attr {

  static async readImage(file) {
    if (!file) return "";
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  }

  async onEvent(e) {
    // if (e.defaultPrevented || e.defaultAction)
    //   return;
    // this.ownerElement.blur(); //todo do we need this one?
    const input = document.createElement("input");
    input.type = "file";
    input.click();
    return new CustomEvent("edit", {
      composed: true,
      bubbles: true,
      detail: await ImageEditAttr.readImage(input.files[0])
    });
  }


}