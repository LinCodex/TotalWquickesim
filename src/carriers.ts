export const TOTAL_WIRELESS = 'total-wireless';

export const carriers = {
  [TOTAL_WIRELESS]: {
    name: 'Total Wireless',
    logo: '/total-wireless-logo.svg',
    help: 'https://www.totalwireless.com/activation'
  },
  'ultra-mobile': {
    name: 'Ultra Mobile',
    logo: '/ultra-mobile.jpg',
    help: 'https://www.ultramobile.com/how-to-activate/'
  },
  'lyca-mobile': {
    name: 'Lyca Mobile',
    logo: '/lyca-mobile.webp',
    help: 'https://www.lycamobile.us/en/esim/how-do-i-activate-my-esim-that-i-ordered-via-lyca-mobile-website/'
  },
  'h2o-wireless': {
    name: 'H2O Wireless',
    logo: '/h2o-wireless.png',
    help: 'https://www.h2owireless.com/esim'
  },
  'cricket-wireless': {
    name: 'Cricket Wireless',
    logo: '/cricket-wireless.png',
    help: 'https://www.cricketwireless.com/how-cricket-works/what-is-esim'
  }
} as const;

export type CarrierId = keyof typeof carriers;

export function isCarrierId(value: string): value is CarrierId {
  return Object.hasOwn(carriers, value);
}
