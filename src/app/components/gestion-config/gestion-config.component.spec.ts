import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionConfigComponent } from './gestion-config.component';

describe('GestionConfigComponent', () => {
  let component: GestionConfigComponent;
  let fixture: ComponentFixture<GestionConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
