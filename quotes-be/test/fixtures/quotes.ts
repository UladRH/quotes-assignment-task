import { Quote } from '../../src/quotes/quotes.types';

export const QUOTE_FIXTURES: Record<string, Quote> = {
  '363': {
    quoteId: '363',
    quote: 'When In Doubt, Go For The Dick Joke.',
    author: 'Robin Williams',
  },
  '519': {
    quoteId: '519',
    quote: 'Never, Never, Never Give Up.',
    author: 'Winston Churchill',
  },
  '594': {
    quoteId: '594',
    quote: 'When you do not know of a thing say so plainly.',
    author: 'Umar ibn Al-Khattab (R.A)',
  },
  '661': {
    quoteId: '661',
    quote: 'When The Going Gets Weird, The Weird Turn Pro.',
    author: 'Hunter S. Thompson',
  },
  '944': {
    quoteId: '944',
    quote: "Who's gonna dare to be great?",
    author: 'Muhammad Ali',
  },
  '1139': {
    quoteId: '1139',
    quote: 'Nothing Will Work Unless You Do.',
    author: 'Maya Angelou',
  },
};

export const SIMILAR_IDS_FIXTURE: Record<string, string[]> = {
  '363': ['944', '661', '594', '1139', '519'],
};
