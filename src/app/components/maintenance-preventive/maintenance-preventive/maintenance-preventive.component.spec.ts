import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenancePreventiveComponent } from './maintenance-preventive.component';

describe('MaintenancePreventiveComponent', () => {
  let component: MaintenancePreventiveComponent;
  let fixture: ComponentFixture<MaintenancePreventiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenancePreventiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaintenancePreventiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
