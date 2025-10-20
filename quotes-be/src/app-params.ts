/**
 * Central registry of tweakable application parameters.
 */
export const APP_PARAMS = Object.freeze({
  quotes: Object.freeze({
    // Random quote rolling knobs.
    randomRoll: Object.freeze({
      maxRerollAttempts: 3, // Retry count before we accept a duplicate roll.
      highRatedChance: 0.1, // Base chance to serve a curated quote for established users.
      newUser: Object.freeze({
        ratedQuoteThreshold: 30, // Rolls treated as onboarding before we reduce boost.
        highRatedChance: 0.7, // Boosted chance for new users to see high-rated quotes.
      }),
    }),
    highRated: Object.freeze({
      bayesianSmoothing: Object.freeze({
        alpha: 1,
        beta: 10,
      }),
      candidatePoolSize: 30, // Number of top-scoring quotes we randomize over.
    }),
    similar: Object.freeze({
      maxLimit: 5, // Hard limit for similar quotes batch size.
    }),
  }),
  session: Object.freeze({
    newUserThresholdMs: 5 * 60 * 1000, // Time window that marks a session as new.
    recentHistoryLimit: 20, // Number of rolled quote ids remembered per session.
  }),
  externalApi: Object.freeze({
    dummyJsonQuotes: Object.freeze({
      /**
       * Maximum length for strings received from external APIs.
       */
      maxStringLength: 10000,
    }),
  }),
} as const);
