import type { Place } from '@/domain/types';

/** Well-known spots offered when tagging a moment (Đà Nẵng first). The backend will serve these later. */
export const POPULAR_PLACES: Place[] = [
  { name: 'Mỹ Khê', lat: 16.0617, lng: 108.2475 },
  { name: 'Chợ Hàn', lat: 16.0687, lng: 108.2246 },
  { name: 'Chợ Cồn', lat: 16.0687, lng: 108.2141 },
  { name: 'Cầu Rồng', lat: 16.0611, lng: 108.2277 },
  { name: 'Sơn Trà', lat: 16.1006, lng: 108.2772 },
  { name: 'Ngũ Hành Sơn', lat: 16.0036, lng: 108.2635 },
  { name: 'An Thượng', lat: 16.0476, lng: 108.2457 },
  { name: 'Bà Nà Hills', lat: 15.9977, lng: 107.9963 },
  { name: 'Hội An', lat: 15.8801, lng: 108.338 },
  { name: 'Cộng Cà Phê', lat: 16.0678, lng: 108.2208 },
];
