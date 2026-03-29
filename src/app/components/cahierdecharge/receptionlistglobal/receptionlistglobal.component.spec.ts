import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionlistglobalComponent } from './receptionlistglobal.component';

describe('ReceptionlistglobalComponent', () => {
  let component: ReceptionlistglobalComponent;
  let fixture: ComponentFixture<ReceptionlistglobalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionlistglobalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReceptionlistglobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
