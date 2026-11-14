// Demo data. The cast exercises every visibility rule: friends, one-way follows, a follower,
// public strangers, a private account with a pending request, and a 17-year-old.
import type { Seed } from './mockRepository';
import { PHOTOS } from './photos';

const m = 60_000;
const now = Date.now();

export const demoSeed: Seed = {
  meId: 'me',
  users: [
    { id: 'me', username: 'sen', name: 'Sen', bio: 'Đà Nẵng', isPrivate: false, age: 24, dmPermission: 'followers', cover: PHOTOS.goldenBridge },
    { id: 'ayse', username: 'ayse.k', name: 'Ayşe', bio: 'kahve + kamera', isPrivate: false, age: 23, dmPermission: 'followers', cover: PHOTOS.coffeeTable },
    { id: 'minh', username: 'minh.ng', name: 'Minh Nguyễn', bio: 'Đà Nẵng · hafta sonları Hội An · film fotoğraf', isPrivate: false, age: 25, dmPermission: 'everyone', cover: PHOTOS.halong },
    { id: 'linh', username: 'linhtran', name: 'Linh Trần', bio: 'street food hunter', isPrivate: false, age: 22, dmPermission: 'friends', cover: PHOTOS.foodPlate },
    { id: 'tuan', username: 'tuan.le', name: 'Tuấn', bio: 'surf · My Khe beach', isPrivate: false, age: 26, dmPermission: 'everyone', cover: PHOTOS.surf },
    { id: 'hana', username: 'hana.travels', name: 'Hana', bio: 'Tokyo → Asia', isPrivate: false, age: 29, dmPermission: 'followers', cover: PHOTOS.shibuya },
    { id: 'jun', username: 'jun.shots', name: 'Jun', bio: 'film photography', isPrivate: false, age: 31, dmPermission: 'followers', cover: PHOTOS.nightSky },
    { id: 'mai', username: 'mai.p', name: 'Mai', bio: '', isPrivate: true, age: 24, dmPermission: 'friends' },
    { id: 'kim', username: 'kim.hoang', name: 'Kim Hoàng', bio: 'An Thượng · coffee', isPrivate: false, age: 27, dmPermission: 'followers' },
    { id: 'an', username: 'an.17', name: 'An', bio: 'high school · badminton', isPrivate: false, age: 17, dmPermission: 'everyone' },
  ],
  follows: [
    { from: 'me', to: 'ayse', status: 'active' },
    { from: 'ayse', to: 'me', status: 'active' },
    { from: 'me', to: 'minh', status: 'active' },
    { from: 'minh', to: 'me', status: 'active' },
    { from: 'me', to: 'linh', status: 'active' },
    { from: 'tuan', to: 'me', status: 'active' },
    { from: 'hana', to: 'me', status: 'active' },
    { from: 'me', to: 'mai', status: 'pending' },
    // Requests waiting for my answer (sent while my profile was private).
    { from: 'jun', to: 'me', status: 'pending' },
    { from: 'kim', to: 'me', status: 'pending' },
  ],
  moments: [
    { id: 'p1', place: { name: 'Cộng Cà Phê', lat: 16.0678, lng: 108.2208 }, authorId: 'ayse', image: PHOTOS.coffee, caption: 'kahve molası ☕', audience: 'friends', createdAt: now - 4 * m, reactions: { minh: 'heart', linh: 'heart', tuan: 'fire' }, comments: [{ id: 'c1', authorId: 'minh', body: 'nerede bu? 👀 ben de geliyorum', createdAt: now - 2 * m }] },
    { id: 'p2', place: { name: 'Chợ Cồn', lat: 16.0687, lng: 108.2141 }, authorId: 'linh', image: PHOTOS.foodPlate, caption: 'street food night', audience: 'friends', createdAt: now - 9 * m, reactions: {}, comments: [] },
    { id: 'p3', place: { name: 'Hải Châu', lat: 16.0611, lng: 108.2209 }, authorId: 'mai', image: PHOTOS.restaurant, caption: 'sunday', audience: 'followers', createdAt: now - 14 * m, reactions: {}, comments: [] },
    { id: 'p4', authorId: 'minh', image: PHOTOS.ninhbinh, caption: 'Ninh Bình hafta sonu', audience: 'followers', createdAt: now - 22 * m, reactions: { ayse: 'fire' }, comments: [] },
    { id: 'p5', place: { name: 'Công viên Biển Đông', lat: 16.0700, lng: 108.2460 }, authorId: 'an', image: PHOTOS.forest, caption: 'school trip!', audience: 'everyone', createdAt: now - 31 * m, reactions: {}, comments: [] },
    { id: 'p6', place: { name: 'Chợ Hàn', lat: 16.0687, lng: 108.2246 }, authorId: 'linh', image: PHOTOS.rice, caption: 'Han pazarında öğle yemeği', audience: 'everyone', createdAt: now - 45 * m, reactions: { me: 'wow' }, comments: [] },
    { id: 'p7', place: { name: 'Mỹ Khê', lat: 16.0617, lng: 108.2475 }, authorId: 'tuan', image: PHOTOS.surf, caption: "Dalgalar bugün cam gibiydi. Yarın 6'da yine buradayım, gelen?", audience: 'everyone', createdAt: now - 70 * m, reactions: {}, comments: [] },
    { id: 'p8', authorId: 'hana', image: PHOTOS.shibuya, caption: 'last night in Shibuya', audience: 'everyone', createdAt: now - 130 * m, reactions: {}, comments: [] },
    { id: 'p9', authorId: 'jun', image: PHOTOS.nightSky, caption: 'uzun pozlama', audience: 'everyone', createdAt: now - 190 * m, reactions: {}, comments: [] },
    { id: 'p10', place: { name: 'Sơn Trà', lat: 16.1006, lng: 108.2772 }, authorId: 'ayse', image: PHOTOS.beachSunset, caption: 'Son Trà gün batımı', audience: 'everyone', createdAt: now - 240 * m, reactions: {}, comments: [] },
    { id: 'p11', place: { name: 'Bà Nà Hills', lat: 15.9977, lng: 107.9963 }, authorId: 'me', image: PHOTOS.goldenBridge, caption: 'Bà Nà Hills 🌉 ilk loopi!', audience: 'friends', createdAt: now - 300 * m, reactions: { ayse: 'heart', minh: 'laugh' }, comments: [] },
    { id: 'p12', place: { name: 'Mì Quảng Bà Mua', lat: 16.0632, lng: 108.2181 }, authorId: 'minh', image: PHOTOS.noodles, caption: 'mì Quảng', audience: 'friends', createdAt: now - 360 * m, reactions: {}, comments: [] },
    { id: 'p13', authorId: 'minh', image: PHOTOS.tokyoStreet, caption: 'Tokyo hatırası', audience: 'everyone', createdAt: now - 26 * 60 * m, reactions: {}, comments: [] },
  ],
  conversations: {
    ayse: [
      { id: 'msg1', fromId: 'ayse', body: 'akşam çıkıyor muyuz?', createdAt: now - 50 * m, read: true },
      { id: 'msg2', fromId: 'me', body: 'olur, 8 gibi? 🙌', createdAt: now - 48 * m, status: 'read' },
    ],
    minh: [{ id: 'msg3', fromId: 'minh', body: 'Hội An bu hafta sonu?', createdAt: now - 180 * m }],
  },
  simAuthors: ['ayse', 'minh'],
  simImages: [PHOTOS.hills, PHOTOS.lake, PHOTOS.road, PHOTOS.boatLake, PHOTOS.clouds, PHOTOS.valley],
  fakeReplies: ['😄', 'haha çok iyi', 'nerdesin şu an?', 'bayıldım 🔥', 'yarın görüşelim mi?', 'An Thượng’da, gelsene ☕'],
};
