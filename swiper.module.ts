import { NgModule } from '@angular/core';
import { SwiperComponent } from './swiper.component';
import { SwiperDirective } from './directives/swiper.directive';
import { SwiperItemDirective } from './directives/swiper-item.directive';

@NgModule({
  declarations: [SwiperComponent, SwiperDirective, SwiperItemDirective],
  exports: [SwiperComponent, SwiperItemDirective],
})
export class SwiperModule {}
