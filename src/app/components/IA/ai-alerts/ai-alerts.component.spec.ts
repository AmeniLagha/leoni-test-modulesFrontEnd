import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiAlertsComponent } from './ai-alerts.component';

describe('AiAlertsComponent', () => {
  let component: AiAlertsComponent;
  let fixture: ComponentFixture<AiAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAlertsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AiAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
