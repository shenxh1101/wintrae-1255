import { Booking, LeaderboardItem, FavoriteContact } from '@/types';
import { mockUsers, mockCurrentUser } from './mockUsers';
import { mockItems } from './mockItems';
import { mockServices } from './mockServices';

export const mockBookings: Booking[] = [
  {
    id: 'b001',
    itemId: 'i001',
    item: mockItems[0],
    publisherId: 'u002',
    publisher: mockUsers[1],
    responderId: 'u001',
    responder: mockCurrentUser,
    appointmentTime: '2026-06-16 19:00',
    status: 'confirmed',
    needBothConfirm: false,
    publisherConfirmed: true,
    responderConfirmed: true,
    completionPhotos: [],
    createdAt: '2026-06-15 15:00',
    type: 'item'
  },
  {
    id: 'b002',
    serviceId: 's003',
    service: mockServices[2],
    publisherId: 'u003',
    publisher: mockUsers[2],
    responderId: 'u004',
    responder: mockUsers[3],
    appointmentTime: '2026-06-16 10:00',
    status: 'confirmed',
    needBothConfirm: false,
    publisherConfirmed: true,
    responderConfirmed: true,
    completionPhotos: [],
    createdAt: '2026-06-15 11:00',
    type: 'service'
  },
  {
    id: 'b003',
    itemId: 'i003',
    item: mockItems[2],
    publisherId: 'u004',
    publisher: mockUsers[3],
    responderId: 'u001',
    responder: mockCurrentUser,
    appointmentTime: '2026-06-16 15:00',
    status: 'pending',
    needBothConfirm: true,
    publisherConfirmed: true,
    responderConfirmed: false,
    completionPhotos: [],
    createdAt: '2026-06-15 21:00',
    type: 'item'
  },
  {
    id: 'b004',
    serviceId: 's004',
    service: mockServices[3],
    publisherId: 'u004',
    publisher: mockUsers[3],
    responderId: 'u010',
    responder: mockUsers[9],
    appointmentTime: '2026-06-16 14:00',
    status: 'in_progress',
    needBothConfirm: false,
    publisherConfirmed: true,
    responderConfirmed: true,
    completionPhotos: [],
    createdAt: '2026-06-15 09:00',
    type: 'service'
  },
  {
    id: 'b005',
    itemId: 'i010',
    item: mockItems[9],
    publisherId: 'u001',
    publisher: mockCurrentUser,
    responderId: 'u005',
    responder: mockUsers[4],
    appointmentTime: '2026-06-15 21:00',
    status: 'completed',
    needBothConfirm: true,
    publisherConfirmed: true,
    responderConfirmed: true,
    completionPhotos: ['https://picsum.photos/id/1/300/300'],
    rating: 5,
    review: '交换很顺利，卡带都是正版的，非常满意！',
    createdAt: '2026-06-14 22:30',
    type: 'item'
  },
  {
    id: 'b006',
    serviceId: 's006',
    service: mockServices[5],
    publisherId: 'u006',
    publisher: mockUsers[5],
    responderId: 'u008',
    responder: mockUsers[7],
    appointmentTime: '2026-06-15 09:00',
    status: 'completed',
    needBothConfirm: false,
    publisherConfirmed: true,
    responderConfirmed: true,
    completionPhotos: ['https://picsum.photos/id/570/300/300'],
    rating: 5,
    review: '阿姨打扫得非常干净，很专业，下次还找她！',
    createdAt: '2026-06-14 12:00',
    type: 'service'
  },
  {
    id: 'b007',
    serviceId: 's009',
    service: mockServices[8],
    publisherId: 'u009',
    publisher: mockUsers[8],
    responderId: 'u002',
    responder: mockUsers[1],
    appointmentTime: '2026-06-16 18:00',
    status: 'pending',
    needBothConfirm: false,
    publisherConfirmed: false,
    responderConfirmed: true,
    completionPhotos: [],
    createdAt: '2026-06-12 20:30',
    type: 'service'
  },
  {
    id: 'b008',
    itemId: 'i006',
    item: mockItems[5],
    publisherId: 'u007',
    publisher: mockUsers[6],
    responderId: 'u001',
    responder: mockCurrentUser,
    appointmentTime: '2026-06-14 19:00',
    status: 'completed',
    needBothConfirm: false,
    publisherConfirmed: true,
    responderConfirmed: true,
    completionPhotos: [],
    rating: 4,
    review: '物品很新，送货也很及时，好评！',
    createdAt: '2026-06-13 21:30',
    type: 'item'
  }
];

export const mockLeaderboard: LeaderboardItem[] = mockUsers
  .map((user, index) => ({
    userId: user.id,
    user,
    exchangeCount: user.exchangeCount,
    serviceCount: Math.floor(Math.random() * 20) + 5,
    totalScore: user.exchangeCount * 10 + Math.floor(Math.random() * 200) + 50,
    rank: index + 1
  }))
  .sort((a, b) => b.totalScore - a.totalScore)
  .map((item, index) => ({ ...item, rank: index + 1 }));

export const mockFavoriteContacts: FavoriteContact[] = [
  {
    id: 'f001',
    userId: 'u001',
    contact: mockUsers[1],
    createdAt: '2026-05-20'
  },
  {
    id: 'f002',
    userId: 'u001',
    contact: mockUsers[5],
    createdAt: '2026-05-15'
  },
  {
    id: 'f003',
    userId: 'u001',
    contact: mockUsers[9],
    createdAt: '2026-05-10'
  }
];

export const getMyBookings = (userId: string) =>
  mockBookings.filter(b => b.publisherId === userId || b.responderId === userId);

export const getBookingsByStatus = (status: string) =>
  mockBookings.filter(b => b.status === status);

export const getMonthlyExchangeCount = (userId: string) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return mockBookings.filter(b =>
    (b.publisherId === userId || b.responderId === userId) &&
    b.status === 'completed' &&
    new Date(b.createdAt) >= monthStart
  ).length;
};
