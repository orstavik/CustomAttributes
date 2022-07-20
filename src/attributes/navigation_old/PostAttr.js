import {getNames, getValue} from "./name_conventions.js";

function open(href, frame, enctype, nameValues) {
  const form = document.createElement("form");
  form.target = frame;
  form.method = "POST";
  form.action = href;
  form.enctype = enctype;
  form.style.display = "none";

  for (let [name, value] of nameValues) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}


function PostAttr(frame, enctype){
  return class PostAttr extends Attr {
    onEvent(e) {
      const nameValues = [...getNames(this.ownerElement)].map(c => [c.getAttribute("name"), getValue(c)]);
      open(this.value, frame, enctype, nameValues);
    }
  } 
}

export const POST_self_urlencoded_Attr = PostAttr("_self", "application/x-www-form-urlencoded");
export const POST_self_formdata_Attr = PostAttr("_self", "multipart/form-data");
export const POST_blank_urlencoded_Attr = PostAttr("_blank", "application/x-www-form-urlencoded");
export const POST_blank_formdata_Attr = PostAttr("_blank", "multipart/form-data");
export const POST_parent_urlencoded_Attr = PostAttr("_parent", "application/x-www-form-urlencoded");
export const POST_parent_formdata_Attr = PostAttr("_parent", "multipart/form-data");
export const POST_top_urlencoded_Attr = PostAttr("_top", "application/x-www-form-urlencoded");
export const POST_top_formdata_Attr = PostAttr("_top", "multipart/form-data");