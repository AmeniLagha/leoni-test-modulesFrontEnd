import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceDetailComponent } from './compliance-detail.component';

describe('ComplianceDetailComponent', () => {
  let component: ComplianceDetailComponent;
  let fixture: ComponentFixture<ComplianceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplianceDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ComplianceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
