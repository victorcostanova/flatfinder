import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavflatsComponent } from './favflats.component';

describe('FavflatsComponent', () => {
  let component: FavflatsComponent;
  let fixture: ComponentFixture<FavflatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavflatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavflatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
