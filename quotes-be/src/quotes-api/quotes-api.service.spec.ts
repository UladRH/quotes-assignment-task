import { Quote, QuotesService } from '../quotes';
import { SessionService, QuSession } from '../session';
import { QuoteDto, QuoteLikeSummaryDto } from './dtos';
import { QuotesApiService } from './quotes-api.service';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('QuotesApiService', () => {
  let service: QuotesApiService;
  let quotesServiceMock: {
    getRolledQuote: jest.Mock;
    getQuoteById: jest.Mock;
    getSimilarQuotes: jest.Mock;
    likeQuote: jest.Mock;
    unlikeQuote: jest.Mock;
  };
  let sessionServiceMock: {
    getRecentRolledQuoteIds: jest.Mock;
    getRolledRandomQuotesCount: jest.Mock;
    addRecentRolledQuoteId: jest.Mock;
    getSessionUserId: jest.Mock;
  };

  beforeEach(() => {
    quotesServiceMock = {
      getRolledQuote: jest.fn(),
      getQuoteById: jest.fn(),
      getSimilarQuotes: jest.fn(),
      likeQuote: jest.fn(),
      unlikeQuote: jest.fn(),
    };

    sessionServiceMock = {
      getRecentRolledQuoteIds: jest.fn(),
      getRolledRandomQuotesCount: jest.fn(),
      addRecentRolledQuoteId: jest.fn(),
      getSessionUserId: jest.fn(),
    };

    service = new QuotesApiService(
      quotesServiceMock as unknown as QuotesService,
      sessionServiceMock as unknown as SessionService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRolledQuote', () => {
    it('uses session data to fetch and record a rolled quote', async () => {
      const session = { id: 'session' } as unknown as QuSession;
      const recentIds = ['r1'];
      const count = 3;
      const quote = { quoteId: 'q1' } as QuoteDto;

      sessionServiceMock.getRecentRolledQuoteIds.mockReturnValue(recentIds);
      sessionServiceMock.getRolledRandomQuotesCount.mockReturnValue(count);
      quotesServiceMock.getRolledQuote.mockResolvedValue(quote);

      const result = await service.getRolledQuote({ session });

      expect(quotesServiceMock.getRolledQuote).toHaveBeenCalledWith({
        excludeQuoteIds: recentIds,
        userRolledRandomQuotesCount: count,
      });
      expect(sessionServiceMock.addRecentRolledQuoteId).toHaveBeenCalledWith({
        session,
        quoteId: quote.quoteId,
      });
      expect(result).toBe(quote);
    });

    it('works without a session', async () => {
      const quote = { quoteId: 'q2' } as QuoteDto;
      sessionServiceMock.getRecentRolledQuoteIds.mockReturnValue([]);
      sessionServiceMock.getRolledRandomQuotesCount.mockReturnValue(null);
      quotesServiceMock.getRolledQuote.mockResolvedValue(quote);

      const result = await service.getRolledQuote();

      expect(sessionServiceMock.getRecentRolledQuoteIds).toHaveBeenCalledWith(
        undefined,
      );
      expect(sessionServiceMock.addRecentRolledQuoteId).toHaveBeenCalledWith({
        session: undefined,
        quoteId: quote.quoteId,
      });
      expect(result).toBe(quote);
    });
  });

  it('delegates getQuoteById to quotes service', async () => {
    const quote = { quoteId: 'q5' } as QuoteDto;
    quotesServiceMock.getQuoteById.mockResolvedValue(quote);

    await expect(service.getQuoteById({ quoteId: 'q5' })).resolves.toBe(quote);
    expect(quotesServiceMock.getQuoteById).toHaveBeenCalledWith({
      quoteId: 'q5',
    });
  });

  it('delegates getSimilarQuotes to quotes service', async () => {
    const quotes = [{ quoteId: 'q1' }] as Quote[];
    quotesServiceMock.getSimilarQuotes.mockResolvedValue(quotes);

    await expect(
      service.getSimilarQuotes({ quoteId: 'base', limit: 3 }),
    ).resolves.toBe(quotes);
    expect(quotesServiceMock.getSimilarQuotes).toHaveBeenCalledWith({
      quoteId: 'base',
      limit: 3,
    });
  });

  it('likes a quote using the current session user', async () => {
    const session = { id: 'session' } as unknown as QuSession;
    const summary = {
      quoteId: 'target',
    } as QuoteLikeSummaryDto;

    sessionServiceMock.getSessionUserId.mockReturnValue('user-1');
    quotesServiceMock.likeQuote.mockResolvedValue(summary);

    const result = await service.likeQuote({ quoteId: 'target', session });

    expect(sessionServiceMock.getSessionUserId).toHaveBeenCalledWith(session);
    expect(quotesServiceMock.likeQuote).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      targetQuoteId: 'target',
    });
    expect(result).toBe(summary);
  });

  it('unlikes a quote using the current session user', async () => {
    const session = { id: 'session' } as unknown as QuSession;
    const summary = {
      quoteId: 'target',
    } as QuoteLikeSummaryDto;

    sessionServiceMock.getSessionUserId.mockReturnValue('user-2');
    quotesServiceMock.unlikeQuote.mockResolvedValue(summary);

    const result = await service.unlikeQuote({ quoteId: 'target', session });

    expect(sessionServiceMock.getSessionUserId).toHaveBeenCalledWith(session);
    expect(quotesServiceMock.unlikeQuote).toHaveBeenCalledWith({
      actorUserId: 'user-2',
      targetQuoteId: 'target',
    });
    expect(result).toBe(summary);
  });
});
