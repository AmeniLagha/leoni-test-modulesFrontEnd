import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceCorrectiveComponent } from './maintenance-corrective.component';

describe('MaintenanceCorrectiveComponent', () => {
  let component: MaintenanceCorrectiveComponent;
  let fixture: ComponentFixture<MaintenanceCorrectiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceCorrectiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaintenanceCorrectiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
