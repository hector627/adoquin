# Adoquín

Adoquín builds a masonry layout from a list of HTML elements.

It doesn't matter if you have list of canvas, images, videos, text, etc. You just need to specify the container of the elements and Adoquín does everything.

## How to use Adoquín?

Just needs to follow 2 steps:

### 1. Create the HTML structure:

```html
<div>
    <div id="grid">
        <!-- items -->
        <div></div>
        <div></div>
    </div>
</div>
```

>[!NOTE]
> You don't need create `<div>` containers, these could be any HTML (of container type) tag that you want.

The structure is composed of 3 parts:
- "Grandparent": It's important because it's the element that Adoquín observes, if you need add an extra space inline (`margin` or `padding`) from CSS you should use this element. You no need add any class or id to this container.
- "Parent": It's the only one needs id, because is the element that Adoquín uses to reference the other elements ("Grandparent" and "children"). 
- "Children": Must contain the content of the cards/pin/etc. You don't need specify class or id for these elements.

>[!IMPORTANT]
> Follow this structure it's necesary for Adoquín to work.

>[!WARNING]
> If you're working with images, videos, etc. we recommended giving them a `width: 100%` style so they adapt to the width of their parent content.

### 2. Specify elements and initialize Adoquinado

```js
import { Adoquinado } from "Adoquin"

const grid = new Adoquinado("id_of_the_parent_elements"); // ej: "grid"

grid.init(); // Initialize Adoquinado
```

## Options object (optional)

The previous sintax accepts an options object as a second param if you want personalize the view of elements, the object signature is:

```ts
export type GridOptions = Partial<{
	gap: number; // Separation of elements (defaul: 16px)
	minColumns: number; // Min column when screen is too small (default: 2)
	columnWidth: number; // The column or elements width (default: 225px)
	minContainerWidth: number; // The min Layout width (default 268px)
	onlyInternalGap: boolean; // Internal separation only (default: false)
}>;
```

### Use with object

```js
import { Adoquinado } from "Adoquin"

const grid = new Adoquinado("grid", {
    gap: 24,
    minColumns: 1,
    columnWidth: 200,
    minContainerWidth: 150,
    onlyInternalGap: true
});

grid.init();

/* 
initialize = | Create container and individual observers
             | Calc layout positions
             | Apply calculated coords and position styles
*/
```

>[!NOTE]
> Each of option for this object can be omitted, you don't need declare them all at the same time.

## Extra methods

Adoquín includes extra methods for differents situations.

### append

Useful when you want add items to the grid container (e.g. for scroll infinite)

- Signature:

```ts
append(newItems: HTMLElement[] | NodeListOf<HTMLElement> | HTMLCollection);
```

- Use:

```js
import { Adoquinado } from "Adoquin";

const $grid = document.getElementByd("grid");
const children = $grid.children;

const masonry = new Adoquinado("grid");
masonry.init();

// Then...
function infiniteScroll(){
    // ...logic
    masonry.append(children);
}
```

### update

If you modify styles or elements externally, you can force a manual recalculation.

```js
import { Adoquinado } from "Adoquin";

const masonry = new Adoquinado("grid");
masonry.init();

// Then...
masonry.update();
```

### destroy

This method destroy the instance if memory is the component is unmounted (React, Vue, etc.)

```js
import { Adoquinado } from "Adoquin"

const masonry = new Adoquinado("grid");
masonry.init();

// Then, when you decide
masonry.destroy();
```

## License

MIT

See [LICENSE](https://github.com/hector627/adoquin/blob/main/LICENSE)