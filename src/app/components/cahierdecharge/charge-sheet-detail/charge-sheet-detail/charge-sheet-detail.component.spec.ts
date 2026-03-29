import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeSheetDetailComponent } from './charge-sheet-detail.component';

describe('ChargeSheetDetailComponent', () => {
  let component: ChargeSheetDetailComponent;
  let fixture: ComponentFixture<ChargeSheetDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeSheetDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeSheetDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
