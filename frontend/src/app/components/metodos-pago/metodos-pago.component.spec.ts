import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetodosPagoComponent } from './metodos-pago.component';

describe('MetodosPagoComponent', () => {
  let component: MetodosPagoComponent;
  let fixture: ComponentFixture<MetodosPagoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MetodosPagoComponent]
    });
    fixture = TestBed.createComponent(MetodosPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
