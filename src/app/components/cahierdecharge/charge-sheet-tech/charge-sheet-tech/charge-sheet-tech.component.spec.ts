import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeSheetTechComponent } from './charge-sheet-tech.component';

describe('ChargeSheetTechComponent', () => {
  let component: ChargeSheetTechComponent;
  let fixture: ComponentFixture<ChargeSheetTechComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargeSheetTechComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargeSheetTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
