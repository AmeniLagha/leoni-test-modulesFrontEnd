import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryAuditedComponent } from './history-audited.component';

describe('HistoryAuditedComponent', () => {
  let component: HistoryAuditedComponent;
  let fixture: ComponentFixture<HistoryAuditedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryAuditedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoryAuditedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
