import { TestBed } from '@angular/core/testing';

import { RankingGogoService } from './ranking-gogo';

describe('RankingGogo', () => {
  let service: RankingGogoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RankingGogoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
