import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalFileListComponent } from './technical-file-list.component';

describe('TechnicalFileListComponent', () => {
  let component: TechnicalFileListComponent;
  let fixture: ComponentFixture<TechnicalFileListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicalFileListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TechnicalFileListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
