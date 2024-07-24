import {
  Directive,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { SwiperService } from '../swiper.service';

@Directive({
  selector: '[swiperItem]',
})
export class SwiperItemDirective implements OnInit {
  public readonly tpl = inject(TemplateRef);
  public readonly container = inject(ViewContainerRef);

  private readonly add$ = inject(SwiperService).add$;

  ngOnInit(): void {
    this.add$.next({
      slide: this,
      view: this.container.createEmbeddedView(this.tpl),
    });
  }
}
