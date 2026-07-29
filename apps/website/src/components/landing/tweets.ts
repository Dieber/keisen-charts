export type FakeTweet = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
};

/** Fictional endorsements for the ring — not real people or quotes. */
export const FAKE_TWEETS: FakeTweet[] = [
  {
    id: '1',
    name: 'Mika Torii',
    handle: '@mikatorii',
    avatar: 'MT',
    text: 'rewrote our chart page in an afternoon. the JSX just… is the chart. how is this legal',
    time: '2h',
  },
  {
    id: '2',
    name: 'Jules Chen',
    handle: '@jules_on_chain',
    avatar: 'JC',
    text: 'tried keisen for a meme portfolio tracker. somehow it looks more serious than our production app',
    time: '5h',
  },
  {
    id: '3',
    name: 'Haru Watanabe',
    handle: '@haru_w',
    avatar: 'HW',
    text: '罫線 means candlestick. naming a chart lib after that and shipping 20kb gzip? respect.',
    time: '8h',
  },
  {
    id: '4',
    name: 'Nova Park',
    handle: '@novapark_dev',
    avatar: 'NP',
    text: 'same API in React and Vue. switched frameworks mid-sprint. the chart did not notice.',
    time: '12h',
  },
  {
    id: '5',
    name: 'Leo Vargas',
    handle: '@leovargas',
    avatar: 'LV',
    text: 'imported KeisenChart, passed data, went for coffee. came back — candles were already drawing.',
    time: '1d',
  },
  {
    id: '6',
    name: 'Aya Okada',
    handle: '@ayaokada',
    avatar: 'AO',
    text: 'told the PM we need two weeks for charts. shipped in two hours. do not tell the PM.',
    time: '1d',
  },
  {
    id: '7',
    name: 'Kit Morales',
    handle: '@kitmorales',
    avatar: 'KM',
    text: 'lightweight, no deps, looks expensive. my design system is jealous.',
    time: '2d',
  },
  {
    id: '8',
    name: 'Ren Sato',
    handle: '@rensato',
    avatar: 'RS',
    text: 'core does the hard work. framework layer is basically a polite handshake. elegant.',
    time: '3d',
  },
];
