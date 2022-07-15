# CustomAttributes

Handle event listeners declaratively. We have two types of custom attributes:
1. Mixin attributes (attributes that extends the element with a set of new properties and methods.) 
2. Mapping attributes (attributes that do, that maps an event to a reaction, commonly a default action).

## Mixin attributes

The `[id]`, `[hidden]`, `[name]` and `[enctype]` are examples native attributes that resemble Mixin attributes. These attributes do not specify a reaction; the attributes are not directly connected to any events. Instead, these attributes specify some properties on the `ownerElement`.
1. The `[id]` attribute is the simplest. It simply ensures that the `[id]` attribute and the `.id` property mirror each other. The `[id]` attribute only provide the element with a set of getter and setter methods for the `.id` property. According to the spec, the value of the `[id]` attribute should also be limited to a certain format, however this has not been implemented by the browser (although it very well could have). 
2. The `[hidden]` attribute defines the `style.display="none"` on the ownerElement. This property should override any css settings, while the browser has given the `[hidden]` attribute a lower priority than some css rules. This is wrong. HTML is the boss, and if something is defined and visible in html, then that should always trump rules in CSS. The `[hidden]` attribute should lock the ability of the developer to specify the `display` property in the style of the element. This is not a reaction, per se, but a restriction for writing. But again, this behavior is not implemented in the browser.
3. The `[name]` attribute is only applied to some input elements such as `<input>` and `<select>`. First, the `[name]` attribute marshalls the `.name` property on the element to reflect the attribute value, just like `[id]`. But, in addition, the `[name]` attribute is also responsible in "creating" a `.value` property on the element, it sets the precedence that a `name`/`value` pair can be retrieved from the element.
4. The `[enctype]` defines how a set of `name`/`value`pairs from the `.elements` of a `<form>` element shall be interpreted. The `[enctype]` essentially provide the element with a getter algorithm for how formData or a urlencoded string of data can be used to get its values. 

Note. The browser do not implement their global attributes as Mixin attributes (although they should have). What we need to do is look past the current implementation and see the Mixin attribute pattern as the minimalist, purest form of implementation of many of them. The browser gives us a lot of attributes that function as use-cases, and the Mixin attributes is the simplest pattern to implement many of them.

## Mapping attributes

The universal attributes is an extension of global event handlers. It is listing different types of event listeners in the DOM itself, it is like seeing the event listener registry on the elements in the template. This is very useful, because hidden state like the normal shadowy eventListener registry that you cannot even access and read from JS is a major cause of bugs and confusion.

What does a UniversalAttribute do? It *maps* an event to a reaction. The universal attribute must therefore specify which event it should react to, and then specify what the reaction should be. And do so in a clear, minimalistic manner.

A mapping attribute entry will create a link between two things:
1. a specific set of events
2. a specific set of actions

The mappings are pure and static. They do not depend on the state of the DOM. If there is an event of a specific type, then we will always trigger the same reaction. However, the action can very well be impure and object bound. The action is applied from the scope of the element in the DOM and contextually from within that elements object state. Mapping static, action object-bound.

### Use-case for custom attributes

We are going to recreate the `<form>` behavior to enable us to treat any part of the DOM as editable. 

1. What should the map to the event to which the reaction should occur. You need to specify either `click` or `auxclick` some if the UniversalAttribute is to 

```html
<div action="/upload" 
     do-click_ctrl="open_newWindow" 
     do-keypress_enter_ctrl="open_newWindow"
     do-keypress_enter="open"
     do-click="open">
  hello sunshine
</div>
```

What if the `[action]` attribute declared a set of new attribute functions? What if `[action]` declared `open-click` and `open_blank-click_ctrl`?

Or better, `post-click_ctrl="url, _blank"`?  //this triggers the submit event and then the action. So. We reduce the set of 

```html

```


Some documentations:

1. [HowTo: run default actions?](md/HowTo_run_default_actions)