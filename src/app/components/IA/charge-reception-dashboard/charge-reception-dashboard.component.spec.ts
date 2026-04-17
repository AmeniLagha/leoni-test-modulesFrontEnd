import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeReceptionDashboardComponent } from './charge-reception-dashboard.component';

describe('ChargeReceptionDashboardComponent', () => {
  let component: ChargeReceptionDashboardComponent;
  let fixture: ComponentFixture<ChargeReceptionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeReceptionDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeReceptionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
