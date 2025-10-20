import { APP_PARAMS } from '../app-params';
import { ExternalApiQuotesFacadeService } from './external-quotes-facade.service';
import { HighRatedQuotesService } from './high-rated';
import { QuotesService } from './quotes.service';
import { Quote } from './quotes.types';
import { SimilarQuotesService } from './similar';
import { QuoteLikeSummary, QuotesStatsService } from './stats';

describe('QuotesService', () => {
  let service: QuotesService;
  let externalApiServiceMock: {
    getRandomQuote: jest.Mock;
    getQuoteById: jest.Mock;
  };
  let similarQuotesServiceMock: { getSimilarQuoteIds: jest.Mock };
  let highRatedQuotesServiceMock: { getRandomQuoteId: jest.Mock };
  let quotesStatsServiceMock: {
    likeQuote: jest.Mock;
    unlikeQuote: jest.Mock;
    registerImpression: jest.Mock;
  };

  beforeEach(() => {
    externalApiServiceMock = {
      getRandomQuote: jest.fn(),
      getQuoteById: jest.fn(),
    };
    similarQuotesServiceMock = {
      getSimilarQuoteIds: jest.fn(),
    };
    highRatedQuotesServiceMock = {
      getRandomQuoteId: jest.fn(),
    };
    quotesStatsServiceMock = {
      likeQuote: jest.fn(),
      unlikeQuote: jest.fn(),
      registerImpression: jest.fn().mockResolvedValue(undefined),
    };

    service = new QuotesService(
      externalApiServiceMock as unknown as ExternalApiQuotesFacadeService,
      similarQuotesServiceMock as unknown as SimilarQuotesService,
      highRatedQuotesServiceMock as unknown as HighRatedQuotesService,
      quotesStatsServiceMock as unknown as QuotesStatsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockRestore();
  });

  describe('getRolledQuote', () => {
    it('prefers high-rated quotes for new users when random threshold hits', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      highRatedQuotesServiceMock.getRandomQuoteId.mockResolvedValue('high-1');
      const highRatedQuote = { quoteId: 'high-1' } as Quote;
      externalApiServiceMock.getQuoteById.mockResolvedValue(highRatedQuote);

      const result = await service.getRolledQuote();

      expect(highRatedQuotesServiceMock.getRandomQuoteId).toHaveBeenCalledWith({
        excludeQuoteIds: [],
      });
      expect(externalApiServiceMock.getQuoteById).toHaveBeenCalledWith(
        'high-1',
      );
      expect(externalApiServiceMock.getRandomQuote).not.toHaveBeenCalled();
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'high-1',
      });
      expect(result).toBe(highRatedQuote);
    });

    it('falls back to random when no high-rated candidate is available', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.05);
      highRatedQuotesServiceMock.getRandomQuoteId.mockResolvedValue(null);
      externalApiServiceMock.getRandomQuote
        .mockResolvedValueOnce({ quoteId: 'skip' } as Quote)
        .mockResolvedValueOnce({ quoteId: 'ok' } as Quote);

      const result = await service.getRolledQuote({
        excludeQuoteIds: ['skip'],
      });

      expect(externalApiServiceMock.getRandomQuote).toHaveBeenCalledTimes(2);
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'ok',
      });
      expect(result.quoteId).toBe('ok');
    });

    it('falls back to random when high-rated retrieval throws', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.01);
      highRatedQuotesServiceMock.getRandomQuoteId.mockRejectedValue(
        new Error('boom'),
      );
      externalApiServiceMock.getRandomQuote.mockResolvedValue({
        quoteId: 'recover',
      } as Quote);

      const result = await service.getRolledQuote();

      expect(externalApiServiceMock.getRandomQuote).toHaveBeenCalled();
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'recover',
      });
      expect(result.quoteId).toBe('recover');
    });

    it('falls back to random when high-rated quote fetch fails', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.02);
      highRatedQuotesServiceMock.getRandomQuoteId.mockResolvedValue('stale');
      externalApiServiceMock.getQuoteById.mockRejectedValue(new Error('404'));
      externalApiServiceMock.getRandomQuote.mockResolvedValue({
        quoteId: 'fallback',
      } as Quote);

      const result = await service.getRolledQuote();

      expect(externalApiServiceMock.getQuoteById).toHaveBeenCalledWith('stale');
      expect(externalApiServiceMock.getRandomQuote).toHaveBeenCalled();
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'fallback',
      });
      expect(result.quoteId).toBe('fallback');
    });

    it('uses base random chance for returning users', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.2);
      externalApiServiceMock.getRandomQuote.mockResolvedValue({
        quoteId: 'random-1',
      } as Quote);

      const result = await service.getRolledQuote({
        userRolledRandomQuotesCount:
          APP_PARAMS.quotes.randomRoll.newUser.ratedQuoteThreshold + 1,
      });

      expect(
        highRatedQuotesServiceMock.getRandomQuoteId,
      ).not.toHaveBeenCalled();
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'random-1',
      });
      expect(result.quoteId).toBe('random-1');
    });

    it('returns the last rolled quote when all attempts are excluded', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      const duplicateQuote = { quoteId: 'dup' } as Quote;
      externalApiServiceMock.getRandomQuote.mockResolvedValue(duplicateQuote);

      const result = await service.getRolledQuote({
        excludeQuoteIds: ['dup'],
        userRolledRandomQuotesCount:
          APP_PARAMS.quotes.randomRoll.newUser.ratedQuoteThreshold + 1,
      });

      expect(externalApiServiceMock.getRandomQuote).toHaveBeenCalledTimes(
        APP_PARAMS.quotes.randomRoll.maxRerollAttempts,
      );
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'dup',
      });
      expect(result).toBe(duplicateQuote);
    });
  });

  it('retrieves a quote by id via external API', async () => {
    const quote = { quoteId: '123' } as Quote;
    externalApiServiceMock.getQuoteById.mockResolvedValue(quote);

    await expect(service.getQuoteById({ quoteId: '123' })).resolves.toBe(quote);
    expect(externalApiServiceMock.getQuoteById).toHaveBeenCalledWith('123');
    expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
      quoteId: '123',
    });
  });

  describe('getSimilarQuotes', () => {
    it('returns an empty array when repository yields no ids', async () => {
      similarQuotesServiceMock.getSimilarQuoteIds.mockResolvedValue([]);

      const result = await service.getSimilarQuotes({
        quoteId: 'base',
        limit: 3,
      });

      expect(result).toEqual([]);
      expect(externalApiServiceMock.getQuoteById).not.toHaveBeenCalled();
      expect(quotesStatsServiceMock.registerImpression).not.toHaveBeenCalled();
    });

    it('returns only fulfilled quote fetches', async () => {
      const firstQuote = { quoteId: 'q1' } as Quote;
      similarQuotesServiceMock.getSimilarQuoteIds.mockResolvedValue([
        'q1',
        'q2',
      ]);
      externalApiServiceMock.getQuoteById
        .mockResolvedValueOnce(firstQuote)
        .mockRejectedValueOnce(new Error('fail'));

      const result = await service.getSimilarQuotes({
        quoteId: 'base',
        limit: 2,
      });

      expect(externalApiServiceMock.getQuoteById).toHaveBeenCalledTimes(2);
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledTimes(
        1,
      );
      expect(quotesStatsServiceMock.registerImpression).toHaveBeenCalledWith({
        quoteId: 'q1',
      });
      expect(result).toEqual([firstQuote]);
    });
  });

  it('delegates likeQuote to stats service', async () => {
    const summary = {
      quoteId: 'target',
    } as QuoteLikeSummary;
    quotesStatsServiceMock.likeQuote.mockResolvedValue(summary);

    await expect(
      service.likeQuote({ actorUserId: 'actor', targetQuoteId: 'target' }),
    ).resolves.toBe(summary);
    expect(quotesStatsServiceMock.likeQuote).toHaveBeenCalledWith({
      actorUserId: 'actor',
      targetQuoteId: 'target',
    });
  });

  it('delegates unlikeQuote to stats service', async () => {
    const summary = {
      quoteId: 'target',
    } as QuoteLikeSummary;
    quotesStatsServiceMock.unlikeQuote.mockResolvedValue(summary);

    await expect(
      service.unlikeQuote({ actorUserId: 'actor', targetQuoteId: 'target' }),
    ).resolves.toBe(summary);
    expect(quotesStatsServiceMock.unlikeQuote).toHaveBeenCalledWith({
      actorUserId: 'actor',
      targetQuoteId: 'target',
    });
  });
});
