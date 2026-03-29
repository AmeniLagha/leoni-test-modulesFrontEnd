import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeSheetListComponent } from './charge-sheet-list.component';

describe('ChargeSheetListComponent', () => {
  let component: ChargeSheetListComponent;
  let fixture: ComponentFixture<ChargeSheetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeSheetListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeSheetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
