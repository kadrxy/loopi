// Bundled sample photos (Unsplash) for the demo data; the app works offline.
export const PHOTOS = {
  bar: require('@/assets/photos/bar.jpg'),
  beachSunset: require('@/assets/photos/beach-sunset.jpg'),
  boatLake: require('@/assets/photos/boat-lake.jpg'),
  clouds: require('@/assets/photos/clouds.jpg'),
  coffee: require('@/assets/photos/coffee.jpg'),
  coffeeTable: require('@/assets/photos/coffee-table.jpg'),
  foodPlate: require('@/assets/photos/food-plate.jpg'),
  forest: require('@/assets/photos/forest.jpg'),
  goldenBridge: require('@/assets/photos/golden-bridge.jpg'),
  halong: require('@/assets/photos/halong.jpg'),
  hills: require('@/assets/photos/hills.jpg'),
  lake: require('@/assets/photos/lake.jpg'),
  nightSky: require('@/assets/photos/night-sky.jpg'),
  ninhbinh: require('@/assets/photos/ninhbinh.jpg'),
  noodles: require('@/assets/photos/noodles.jpg'),
  restaurant: require('@/assets/photos/restaurant.jpg'),
  rice: require('@/assets/photos/rice.jpg'),
  road: require('@/assets/photos/road.jpg'),
  shibuya: require('@/assets/photos/shibuya.jpg'),
  surf: require('@/assets/photos/surf.jpg'),
  tokyoStreet: require('@/assets/photos/tokyo-street.jpg'),
  valley: require('@/assets/photos/valley.jpg'),
} as const;

export const SAMPLE_PHOTOS: number[] = [PHOTOS.coffeeTable, PHOTOS.halong, PHOTOS.bar, PHOTOS.tokyoStreet];
export const WALLPAPER: number = PHOTOS.clouds;
