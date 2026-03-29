import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatetechniquefileComponent } from './createtechniquefile.component';

describe('CreatetechniquefileComponent', () => {
  let component: CreatetechniquefileComponent;
  let fixture: ComponentFixture<CreatetechniquefileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatetechniquefileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreatetechniquefileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
