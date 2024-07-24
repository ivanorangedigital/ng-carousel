import {
  AfterRenderPhase,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';
import { SwiperInterface } from '../interfaces/swiper.interface';
import { Subject, interval, takeUntil } from 'rxjs';
import { animate } from 'motion';
import { ScreenSizeEnum } from '../../../enums/screen-size.enum';
import { WindowService } from '../../../../core/services/window.service';
import { SwiperService } from '../swiper.service';

@Directive({
  selector: '[swiper]',
})
export class SwiperDirective implements OnDestroy, OnInit {
  public readonly config = input.required<SwiperInterface>();

  // provider
  private readonly swiperService = inject(SwiperService);

  // consumers
  private readonly data = this.swiperService.data;

  // reducers
  private readonly update$ = this.swiperService.update$;

  private readonly size$ = inject(WindowService).size$;

  private readonly swiperContainer: ElementRef<HTMLElement> =
    inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  // state
  private readonly state = signal({
    width: 0,
    index: 0,
    nodes: <HTMLElement[]>[],
    breakpoints: <{ [key in ScreenSizeEnum]: number }>{},
    slidesPerView: 0,
    spaceBetween: 0,
    loop: false,
  });

  // check if swiper is in animation state
  private isRunning = false;

  constructor() {
    afterNextRender(
      () => {
        const { spaceBetween, loop, autoplay } = this.config();

        // get nodes
        const nodes = [].slice.call(
          this.swiperContainer.nativeElement.children,
        ) as HTMLElement[];

        // build breakpoints
        this.buildBreakpoints(nodes);

        // detect how many slidesPerView
        const slidesOnViewport = nodes.filter((node) => {
          const bounds = node.getBoundingClientRect();
          const width = bounds.right - bounds.left;
          return width > 0;
        });
        const slidesPerView = slidesOnViewport.length;

        // define witdh for every el
        const width =
          (this.swiperContainer.nativeElement.parentNode as HTMLDivElement)
            .clientWidth / slidesPerView;

        this.widthWrapper = width * nodes.length;

        this.state.update((state) => ({
          ...state,
          slidesPerView,
          spaceBetween,
          width,
          nodes,
          loop: loop && nodes.length >= slidesPerView ? true : false,
        }));

        this.render(() => {
          nodes.forEach((node) => {
            const matches = node.classList
              .toString()
              .split(' ')
              .reduce(
                (acc, cls) => {
                  const matched = cls.match(/sm:*|md:*|lg:*|xl:*/);
                  if (matched) return [...acc, matched.input as string];
                  return acc;
                },
                <string[]>[],
              );

            node.classList.remove('flex-1', 'hidden', ...matches);
          });

          // autoplay start
          // if (autoplay)
          //   interval(autoplay)
          //     .pipe(takeUntil(this.destroy$))
          //     .subscribe(() => this.slideNext());
        });

        // subscribe to window resize event
        this.size$
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.updateOnScreenResize());
      },
      {
        phase: AfterRenderPhase.Write,
      },
    );
  }

  ngOnInit(): void {
    const { spaceBetween } = this.config();

    // set space-x-n
    this.spaceXValue = spaceBetween;
  }

  private buildBreakpoints(nodes: HTMLElement[]): void {
    const breakpoints = {
      '0': 0,
      sm: 0,
      md: 0,
      lg: 0,
      xl: 0,
    };
    const keys = Object.keys(breakpoints);

    nodes.forEach((node) => {
      const classList = node.classList.toString();
      const isbreakpoint = classList.match(/sm:*|md:*|lg:*|xl:*/);

      // slidesPerView for mobile
      if (classList.match('flex-1') && !isbreakpoint) {
        breakpoints['0']++;
        // breakpoints slide
      } else if (isbreakpoint) {
        const key = isbreakpoint[0].split(':')[0] as 'sm' | 'md' | 'lg' | 'xl';

        if (!breakpoints[key]) {
          for (
            let i = keys.findIndex((_key) => _key === key) - 1;
            i >= 0;
            i--
          ) {
            if ((breakpoints as any)[keys[i]]) {
              breakpoints[key] += (breakpoints as any)[keys[i]] + 1;
              break;
            }
          }
        } else breakpoints[key]++;
      }
    });

    // update state
    this.state.update((state) => ({
      ...state,
      breakpoints: {
        [ScreenSizeEnum.ZERO]: breakpoints['0'],
        [ScreenSizeEnum.SM]: breakpoints['sm'],
        [ScreenSizeEnum.MD]: breakpoints['md'],
        [ScreenSizeEnum.LG]: breakpoints['lg'],
        [ScreenSizeEnum.XL]: breakpoints['xl'],
      },
    }));
  }

  public async slidePrev(): Promise<void> {
    if (this.isRunning) return;

    // start running
    this.isRunning = true;

    const state = this.state();

    const { width, spaceBetween, slidesPerView, loop } = state;
    let { index } = state;

    if (!index) {
      // if no loop enable close
      if (!loop) return;

      const data = this.data();

      for (let i = 0; i < data.length; i++) {
        data[i].slide.container.detach();

        if (!i) {
          data[0].slide.container.insert(data[data.length - 1].view);
          continue;
        }

        data[i].slide.container.insert(data[i - 1].view);
      }

      // update state
      this.update$.next('left');

      // increase index by 1
      index++;

      await this.translate(
        width * index + (spaceBetween / slidesPerView) * index,
        0,
      );
    }

    await this.translate(
      width * (index - 1) + (spaceBetween / slidesPerView) * (index - 1),
    );

    this.state.update((state) => ({
      ...state,
      index: index - 1,
    }));
  }

  public async slideNext(): Promise<void> {
    if (this.isRunning) return;

    // start running
    this.isRunning = true;

    const state = this.state();

    const { width, nodes, spaceBetween, slidesPerView, loop } = state;
    let { index } = state;

    if (index + slidesPerView >= nodes.length) {
      // if no loop enable close
      if (!loop) return;

      const data = this.data();

      for (let i = 0; i < data.length; i++) {
        data[i].slide.container.detach();

        if (!(i + 1 < data.length)) {
          data[data.length - 1].slide.container.insert(data[0].view);
          break;
        }

        data[i].slide.container.insert(data[i + 1].view);
      }

      // update state
      this.update$.next('right');

      index--;

      await this.translate(
        width * index + (spaceBetween / slidesPerView) * index,
        0,
      );
    }

    await this.translate(
      width * (index + 1) + (spaceBetween / slidesPerView) * (index + 1),
    );

    this.state.update((state) => ({
      ...state,
      index: index + 1,
    }));
  }

  private render(cb?: () => void): void {
    const { width, spaceBetween, slidesPerView, nodes } = this.state();

    // last slide go out for spaceBetween * (slidesPerView - 1)
    const miss = spaceBetween * (slidesPerView - 1);
    // diff to remove from original width
    const diff = miss / slidesPerView;

    nodes.forEach((node) => {
      node.style.minWidth = `${width - diff}px`;
      node.style.maxWidth = `${width - diff}px`;
    });

    // end render
    if (cb) setTimeout(cb, 0);
  }

  private async updateOnScreenResize(): Promise<void> {
    // update slidesPerView
    this.updateSlidesPerView();

    const width = this.width;
    const { index, spaceBetween, slidesPerView } = this.state();

    // udpate state
    this.state.update((state) => ({
      ...state,
      width,
    }));

    // render
    this.render();

    // adjust position
    await this.translate(
      width * index + (spaceBetween / slidesPerView) * index,
      0,
    );
  }

  // function to translate swiper wrapper to left (right direction)
  private async translate(value: number, duration?: number): Promise<void> {
    return animate(
      this.swiperContainer.nativeElement,
      {
        x: `-${value}px`,
      },
      { duration: duration ?? 0.6, easing: 'ease-in-out' },
    ).finished.then((res) => {
      if (res && duration !== 0) {
        this.isRunning = false;
      }
    });
  }

  private set spaceXValue(value: number) {
    this.swiperContainer.nativeElement.style.setProperty(
      '--app-space-x-value',
      `${value}px`,
    );
  }

  private set widthWrapper(value: number) {
    this.swiperContainer.nativeElement.style.minWidth = `${value}px`;
    this.swiperContainer.nativeElement.style.maxWidth = `${value}px`;
  }

  private get width(): number {
    const { slidesPerView } = this.state();
    return (
      (this.swiperContainer.nativeElement.parentNode as HTMLDivElement)
        .clientWidth / slidesPerView
    );
  }

  private updateSlidesPerView(): void {
    const screenWidth = innerWidth;

    const breakpoints = this.state().breakpoints;
    const keys = Object.keys(breakpoints) as unknown as number[];

    // sort it
    keys.sort((a, b) => b - a);

    for (let i = 0; i < keys.length; i++) {
      if ((breakpoints as any)[keys[i]] && screenWidth >= keys[i]) {
        this.state.update((state) => ({
          ...state,
          slidesPerView: (breakpoints as any)[keys[i]],
        }));
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
