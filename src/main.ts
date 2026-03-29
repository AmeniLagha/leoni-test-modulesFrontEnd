import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { importProvidersFrom, NgModule } from '@angular/core';
import { provideRouter, RouterModule } from '@angular/router';
import { routes } from './app/app.routes';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(ReactiveFormsModule, HttpClientModule)
  ]
}).catch(err => console.error(err));
