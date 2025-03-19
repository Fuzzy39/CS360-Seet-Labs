import { TestBed } from '@angular/core/testing';

import { JsonServerTestService } from './json-server-test.service';

describe('JsonServerTestService', () => {
  let service: JsonServerTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonServerTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
