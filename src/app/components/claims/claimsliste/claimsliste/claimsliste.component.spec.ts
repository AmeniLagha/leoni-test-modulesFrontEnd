import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimslisteComponent } from './claimsliste.component';

describe('ClaimslisteComponent', () => {
  let component: ClaimslisteComponent;
  let fixture: ComponentFixture<ClaimslisteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimslisteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClaimslisteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
