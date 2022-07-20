export class AtAttr extends Attr{
  onEvent(e){
    this.ownerElement.hasAttribute(this.value) ?
      this.ownerElement.removeAttribute(this.value) :
      this.ownerElement.setAttribute(this.value, "");
  }
}