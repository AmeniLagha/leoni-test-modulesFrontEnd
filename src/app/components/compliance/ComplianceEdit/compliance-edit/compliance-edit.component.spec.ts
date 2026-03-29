import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceEditComponent } from './compliance-edit.component';

describe('ComplianceEditComponent', () => {
  let component: ComplianceEditComponent;
  let fixture: ComponentFixture<ComplianceEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplianceEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ComplianceEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
