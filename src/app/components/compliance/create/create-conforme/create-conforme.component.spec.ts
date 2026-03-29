import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateConformeComponent } from './create-conforme.component';

describe('CreateConformeComponent', () => {
  let component: CreateConformeComponent;
  let fixture: ComponentFixture<CreateConformeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateConformeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateConformeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
