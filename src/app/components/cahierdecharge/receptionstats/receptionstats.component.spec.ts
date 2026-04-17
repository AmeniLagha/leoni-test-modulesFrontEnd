import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionstatsComponent } from './receptionstats.component';

describe('ReceptionstatsComponent', () => {
  let component: ReceptionstatsComponent;
  let fixture: ComponentFixture<ReceptionstatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionstatsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReceptionstatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
