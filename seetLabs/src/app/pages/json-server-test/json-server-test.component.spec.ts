import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonServerTestComponent } from './json-server-test.component';

describe('JsonServerTestComponent', () => {
  let component: JsonServerTestComponent;
  let fixture: ComponentFixture<JsonServerTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonServerTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonServerTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
