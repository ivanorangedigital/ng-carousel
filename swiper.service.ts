import { Injectable, ViewRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { SwiperItemDirective } from './directives/swiper-item.directive';

@Injectable()
export class SwiperService {
  private readonly state = signal<
    { slide: SwiperItemDirective; view: ViewRef }[]
  >([]);

  public readonly data = computed(() => this.state());

  public readonly add$ = new Subject<{
    slide: SwiperItemDirective;
    view: ViewRef;
  }>();
  public readonly update$ = new Subject<'left' | 'right'>();

  constructor() {
    this.add$
      .pipe(takeUntilDestroyed())
      .subscribe((data) => this.state.update((state) => [...state, data]));

    this.update$.pipe(takeUntilDestroyed()).subscribe((direction) => {
      const data = this.data();
      const views = <ViewRef[]>[];

      if (direction === 'left') {
        // [0, 1, 2, 3] => in
        views.push(data[data.length - 1].view);
        for (let i = 0; i < data.length - 1; i++) {
          views.push(data[i].view);
        }
        // [3, 0, 1, 2] => out
      } else {
        // [0, 1, 2, 3] => in
        for (let i = 1; i < data.length; i++) {
          views.push(data[i].view);
        }
        views.push(data[0].view);
        // [1, 2, 3, 0] => out
      }

      // state update
      this.state.update((state) =>
        state.map((item, i) => ({ slide: item.slide, view: views[i] })),
      );
    });
  }
}
