import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailstechfileComponent } from './detailstechfile.component';

describe('DetailstechfileComponent', () => {
  let component: DetailstechfileComponent;
  let fixture: ComponentFixture<DetailstechfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailstechfileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailstechfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
