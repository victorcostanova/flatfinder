import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewflatComponent } from './previewflat.component';

describe('PreviewflatComponent', () => {
  let component: PreviewflatComponent;
  let fixture: ComponentFixture<PreviewflatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewflatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewflatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
