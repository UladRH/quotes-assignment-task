import { QuotesStatsRepo } from './quotes-stats.repository';
import { QuoteLikeSummary, QuotesStatsService } from './quotes-stats.service';

describe('QuotesStatsService', () => {
  let service: QuotesStatsService;
  let repoMock: {
    likeQuote: jest.Mock;
    unlikeQuote: jest.Mock;
    incrementImpressionsCount: jest.Mock;
  };

  beforeEach(() => {
    repoMock = {
      likeQuote: jest.fn(),
      unlikeQuote: jest.fn(),
      incrementImpressionsCount: jest.fn(),
    };

    service = new QuotesStatsService(repoMock as unknown as QuotesStatsRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('likes a quote via repository and maps the response', async () => {
    repoMock.likeQuote.mockResolvedValue({
      likesCount: 5,
      impressionsCount: 10,
      changed: true,
    });

    const result = await service.likeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote',
    });

    const expected: QuoteLikeSummary = {
      quoteId: 'quote',
      likesCount: 5,
      impressionsCount: 10,
      isLiked: true,
      changed: true,
    };

    expect(repoMock.likeQuote).toHaveBeenCalledWith({
      actorUserId: 'user',
      targetQuoteId: 'quote',
    });
    expect(result).toEqual(expected);
  });

  it('unlikes a quote via repository and maps the response', async () => {
    repoMock.unlikeQuote.mockResolvedValue({
      likesCount: 3,
      impressionsCount: 12,
      changed: false,
    });

    const result = await service.unlikeQuote({
      actorUserId: 'user',
      targetQuoteId: 'quote',
    });

    const expected: QuoteLikeSummary = {
      quoteId: 'quote',
      likesCount: 3,
      impressionsCount: 12,
      isLiked: false,
      changed: false,
    };

    expect(repoMock.unlikeQuote).toHaveBeenCalledWith({
      actorUserId: 'user',
      targetQuoteId: 'quote',
    });
    expect(result).toEqual(expected);
  });

  it('registers quote impressions', async () => {
    await service.registerImpression({ quoteId: 'quote' });

    expect(repoMock.incrementImpressionsCount).toHaveBeenCalledWith('quote');
  });
});
