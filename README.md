### Needed Packages
- `motion`
- `tailwind`

### Implementation Details
- `size$` is an observable for window resize detection (you can implement it yourself).

### ScreenSizeEnum
```typescript
export enum ScreenSizeEnum {
  ZERO = 0,
  SM = 640,
  MD = 768,
  LG = 1024,
  XL = 1280,
}
```

### Carousel Support
This carousel supports breakpoints based on Tailwind classes (0, sm, md, lg, xl).

- No Cumulative Layout Shift (CLS)
- Supports Server side rendering
- Support Hydration

### Breakpoints Configuration
Instead of having fields for breakpoints like `slidesPerView`, use Tailwind classes to achieve the desired layout.

### Importing SwiperModule
Import `SwiperModule` in your component.

### Sample Carousel Implementation
Here’s an example of a carousel that displays:
- 1 slide for 0 breakpoint
- 2 slides for md breakpoint
- 3 slides for lg breakpoint
- 5 slides for xl breakpoint

```html
<app-swiper [config]="{ spaceBetween: 24, loop: true }" #swiper>
  <ng-template swiperItem>
    <div class="bg-red-500 h-[30vh] flex-1"></div>
  </ng-template>
  <ng-template swiperItem>
    <div swiperItem class="bg-blue-500 h-[30vh] md:flex-1 md:block hidden"></div>
  </ng-template>
  ...
  <div swiperItem class="bg-orange-500 h-[30vh] lg:flex-1 lg:block hidden"></div>
  <div swiperItem class="bg-red-500 h-[30vh] lg:flex-1 lg:block hidden"></div>
  <div swiperItem class="bg-red-500 h-[30vh] xl:flex-1 xl:block hidden"></div>
  <div swiperItem class="bg-red-500 h-[30vh] xl:flex-1 xl:block hidden"></div>

  <button swiperFooter (click)="swiper.slideNext()">next</button>
  <button swiperFooter (click)="swiper.slidePrev()">prev</button>
</app-swiper>
```

### Notes
- Use the `flex-1` class to avoid CLS because the width is set by JavaScript. This class helps build the initial layout without CLS for every breakpoint. Use the `hidden` class to hide slides.
- When `afterNextRender` executes, the algorithm builds a breakpoints object, removes all `hidden` and `flex-1` classes, and removes all width queries like md, lg, etc. If you need to use them, make sure they are inside the slide div.

### `spaceBetween` Configuration
To make `spaceBetween` work, add the following lines to your `.scss` file:

```scss
@mixin app-space-x($space) {
  > :not([hidden]) ~ :not([hidden]) {
    margin-left: $space;
  }
}

.app-space-x {
  @include app-space-x(var(--app-space-x-value));
}
```

### TODO
- Add a correct autoplay function
- Add different animation types

Feel free to ask for more options or changes. You can also make the changes yourself and contact me for updates.
