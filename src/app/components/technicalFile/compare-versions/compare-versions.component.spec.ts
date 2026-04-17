import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareVersionsComponent } from './compare-versions.component';

describe('CompareVersionsComponent', () => {
  let component: CompareVersionsComponent;
  let fixture: ComponentFixture<CompareVersionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompareVersionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompareVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
