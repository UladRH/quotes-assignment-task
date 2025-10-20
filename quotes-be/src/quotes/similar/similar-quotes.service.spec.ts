import { SimilarQuotesRepo } from './similar-quotes.repo';
import { SimilarQuotesService } from './similar-quotes.service';

describe('SimilarQuotesService', () => {
  let service: SimilarQuotesService;
  let repoMock: { findSimilarQuoteIds: jest.Mock };

  beforeEach(() => {
    repoMock = {
      findSimilarQuoteIds: jest.fn(),
    };

    service = new SimilarQuotesService(
      repoMock as unknown as SimilarQuotesRepo,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list when limit is not positive', async () => {
    await expect(
      service.getSimilarQuoteIds({ quoteId: 'q1', limit: 0 }),
    ).resolves.toEqual([]);
    expect(repoMock.findSimilarQuoteIds).not.toHaveBeenCalled();
  });

  it('delegates to the repository when limit is positive', async () => {
    repoMock.findSimilarQuoteIds.mockResolvedValue(['a', 'b']);

    await expect(
      service.getSimilarQuoteIds({ quoteId: 'q1', limit: 2 }),
    ).resolves.toEqual(['a', 'b']);
    expect(repoMock.findSimilarQuoteIds).toHaveBeenCalledWith({
      quoteId: 'q1',
      limit: 2,
    });
  });
});
