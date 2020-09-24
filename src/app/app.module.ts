import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { CounterComponent } from './counter/counter.component';
import { FetchDataComponent } from './fetch-data/fetch-data.component';
import { TimeLineComponent } from './time-line/time-line.component';
import { VisTimelineExampleComponent } from './time-line/timeline-example.component';
import { ItemContentDialog } from './time-line/timeline-example.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-module';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    CounterComponent,
    FetchDataComponent,
    TimeLineComponent,
    VisTimelineExampleComponent,
    ItemContentDialog
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      //{ path: '', component: HomeComponent, pathMatch: 'full' },
      //{ path: 'counter', component: CounterComponent },
      //{ path: 'fetch-data', component: FetchDataComponent },
      //{ path: 'time-line', component: TimeLineComponent },
      //{ path: 'timeline-example', component: VisTimelineExampleComponent },
      { path: '', component: VisTimelineExampleComponent, pathMatch: 'full' }
    ]),
    BrowserAnimationsModule,
    MaterialModule
  ],
  entryComponents: [
    ItemContentDialog
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
