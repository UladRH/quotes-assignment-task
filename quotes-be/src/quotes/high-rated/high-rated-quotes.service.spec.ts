import { HighRatedQuotesRepo } from './high-rated-quotes.repo';
import { HighRatedQuotesService } from './high-rated-quotes.service';

describe('HighRatedQuotesService', () => {
  let service: HighRatedQuotesService;
  let repoMock: { pickRandomQuoteId: jest.Mock };

  beforeEach(() => {
    repoMock = {
      pickRandomQuoteId: jest.fn(),
    };

    service = new HighRatedQuotesService(
      repoMock as unknown as HighRatedQuotesRepo,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to repository with provided options', async () => {
    repoMock.pickRandomQuoteId.mockResolvedValue('quote-1');

    await expect(
      service.getRandomQuoteId({ excludeQuoteIds: ['a'] }),
    ).resolves.toBe('quote-1');
    expect(repoMock.pickRandomQuoteId).toHaveBeenCalledWith({
      excludeQuoteIds: ['a'],
    });
  });

  it('supports default arguments', async () => {
    repoMock.pickRandomQuoteId.mockResolvedValue(null);

    await expect(service.getRandomQuoteId()).resolves.toBeNull();
    expect(repoMock.pickRandomQuoteId).toHaveBeenCalledWith({
      excludeQuoteIds: [],
    });
  });
});
