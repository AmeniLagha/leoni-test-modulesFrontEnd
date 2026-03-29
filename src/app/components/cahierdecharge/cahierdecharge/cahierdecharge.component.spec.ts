import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CahierdechargeComponent } from './cahierdecharge.component';

describe('CahierdechargeComponent', () => {
  let component: CahierdechargeComponent;
  let fixture: ComponentFixture<CahierdechargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CahierdechargeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CahierdechargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
