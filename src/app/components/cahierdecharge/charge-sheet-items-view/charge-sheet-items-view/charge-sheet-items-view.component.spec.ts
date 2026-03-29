import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeSheetItemsViewComponent } from './charge-sheet-items-view.component';

describe('ChargeSheetItemsViewComponent', () => {
  let component: ChargeSheetItemsViewComponent;
  let fixture: ComponentFixture<ChargeSheetItemsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeSheetItemsViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeSheetItemsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
