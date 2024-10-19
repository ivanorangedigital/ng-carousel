import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  input,
  viewChild,
} from "@angular/core";
import { SwiperItemDirective } from "./directives/swiper-item.directive";
import { SwiperInterface } from "./interfaces/swiper.interface";
import { SwiperDirective } from "./directives/swiper.directive";
import { SwiperService } from "./swiper.service";

@Component({
  templateUrl: "./swiper.component.html",
  selector: "app-swiper",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SwiperService],
  host: {
    class: "relative overflow-hidden block",
  },
})
export class SwiperComponent {
  public readonly config = input.required<SwiperInterface>();

  private readonly swiperDirective = viewChild.required(SwiperDirective);
  public swiperItems = contentChildren(SwiperItemDirective);

  public slideNext(): void {
    this.swiperDirective().slideNext();
  }

  public slidePrev(): void {
    this.swiperDirective().slidePrev();
  }
}
