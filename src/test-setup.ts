// src/test-setup.ts
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Configuration globale pour tous les tests
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Ajout global des providers
getTestBed().configureTestingModule({
  providers: [
    provideHttpClient(),
    provideRouter([])
  ]
});
