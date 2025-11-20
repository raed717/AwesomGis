import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapefilesComponent } from './shapefiles.component';

describe('ShapefilesComponent', () => {
  let component: ShapefilesComponent;
  let fixture: ComponentFixture<ShapefilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShapefilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShapefilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
