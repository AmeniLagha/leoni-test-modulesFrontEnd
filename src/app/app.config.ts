import { ApplicationConfig, importProvidersFrom, NgModule } from '@angular/core';
import { provideRouter, RouterModule } from '@angular/router';

import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
@NgModule({
  declarations: [

  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes) // routes
  ],

})
export class AppModule {}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(BrowserModule)
  ]
};


