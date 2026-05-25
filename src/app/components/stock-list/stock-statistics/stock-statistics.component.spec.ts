import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockStatisticsComponent } from './stock-statistics.component';

describe('StockStatisticsComponent', () => {
  let component: StockStatisticsComponent;
  let fixture: ComponentFixture<StockStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockStatisticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StockStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
