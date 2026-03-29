import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdittechniquefileComponent } from './edittechniquefile.component';

describe('EdittechniquefileComponent', () => {
  let component: EdittechniquefileComponent;
  let fixture: ComponentFixture<EdittechniquefileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdittechniquefileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EdittechniquefileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
