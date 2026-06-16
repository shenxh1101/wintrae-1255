import { create } from 'zustand';
import { User, Item, Service, Booking, Message, FavoriteContact, LeaderboardItem } from '@/types';
import { mockCurrentUser } from '@/data/mockUsers';
import { mockItems } from '@/data/mockItems';
import { mockServices } from '@/data/mockServices';
import { mockBookings, mockLeaderboard, mockFavoriteContacts, getMonthlyExchangeCount } from '@/data/mockBookings';
import { mockMessages, getUnreadCount } from '@/data/mockMessages';

interface AppState {
  currentUser: User;
  items: Item[];
  services: Service[];
  bookings: Booking[];
  messages: Message[];
  leaderboard: LeaderboardItem[];
  favoriteContacts: FavoriteContact[];
  selectedBuilding: string;
  searchKeyword: string;
  unreadCount: number;
  monthlyExchangeCount: number;
  setSelectedBuilding: (building: string) => void;
  setSearchKeyword: (keyword: string) => void;
  addItem: (item: Item) => void;
  addService: (service: Service) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  markMessageRead: (messageId: string) => void;
  confirmBooking: (bookingId: string, isPublisher: boolean) => void;
  completeBooking: (bookingId: string, photos: string[], rating: number, review: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  items: mockItems,
  services: mockServices,
  bookings: mockBookings,
  messages: mockMessages,
  leaderboard: mockLeaderboard,
  favoriteContacts: mockFavoriteContacts,
  selectedBuilding: '',
  searchKeyword: '',
  unreadCount: getUnreadCount(mockCurrentUser.id),
  monthlyExchangeCount: getMonthlyExchangeCount(mockCurrentUser.id),

  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addItem: (item) => set((state) => ({
    items: [item, ...state.items]
  })),

  addService: (service) => set((state) => ({
    services: [service, ...state.services]
  })),

  updateBooking: (bookingId, updates) => set((state) => ({
    bookings: state.bookings.map(b =>
      b.id === bookingId ? { ...b, ...updates } : b
    )
  })),

  markMessageRead: (messageId) => set((state) => ({
    messages: state.messages.map(m =>
      m.id === messageId ? { ...m, isRead: true } : m
    ),
    unreadCount: state.unreadCount - 1
  })),

  confirmBooking: (bookingId, isPublisher) => {
    const state = get();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const updates: Partial<Booking> = isPublisher
      ? { publisherConfirmed: true }
      : { responderConfirmed: true };

    if (
      (booking.needBothConfirm && booking.publisherConfirmed !== isPublisher && (isPublisher ? booking.responderConfirmed : booking.publisherConfirmed)) ||
      !booking.needBothConfirm
    ) {
      updates.status = 'confirmed';
    }

    set({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, ...updates } : b
      )
    });
  },

  completeBooking: (bookingId, photos, rating, review) => set((state) => ({
    bookings: state.bookings.map(b =>
      b.id === bookingId
        ? { ...b, status: 'completed', completionPhotos: photos, rating, review }
        : b
    )
  }))
}));
