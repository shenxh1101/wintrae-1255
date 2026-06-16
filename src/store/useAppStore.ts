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
  sortBy: 'time' | 'distance' | 'rating';
  unreadCount: number;
  monthlyExchangeCount: number;
  setSelectedBuilding: (building: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setSortBy: (sort: 'time' | 'distance' | 'rating') => void;
  addItem: (item: Item) => void;
  addService: (service: Service) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'completionPhotos' | 'publisherConfirmed' | 'responderConfirmed'>) => string;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  markMessageRead: (messageId: string) => void;
  confirmBooking: (bookingId: string, isPublisher: boolean) => void;
  completeBooking: (bookingId: string, data: { photos?: string[]; rating?: number; review?: string; tags?: string[] }) => void;
  publisherCompleteBooking: (bookingId: string, photos?: string[]) => boolean;
  responderConfirmComplete: (bookingId: string) => boolean;
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
  sortBy: 'time',
  unreadCount: getUnreadCount(mockCurrentUser.id),
  monthlyExchangeCount: getMonthlyExchangeCount(mockCurrentUser.id),

  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSortBy: (sort) => set({ sortBy: sort }),

  addItem: (item) => set((state) => ({
    items: [item, ...state.items]
  })),

  addService: (service) => set((state) => ({
    services: [service, ...state.services]
  })),

  addBooking: (bookingInput) => {
    const id = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newBooking: Booking = {
      ...bookingInput,
      id,
      completionPhotos: [],
      publisherConfirmed: bookingInput.status === 'confirmed',
      responderConfirmed: bookingInput.status === 'confirmed',
      publisherCompleted: false,
      responderCompleted: false,
      createdAt: new Date().toISOString()
    };
    set((state) => ({ bookings: [newBooking, ...state.bookings] }));

    if (bookingInput.type === 'item' && bookingInput.itemId) {
      set((state) => ({
        items: state.items.map(i =>
          i.id === bookingInput.itemId ? { ...i, status: 'reserved' as const } : i
        )
      }));
    }

    if (bookingInput.type === 'service' && bookingInput.serviceId) {
      set((state) => ({
        services: state.services.map(s =>
          s.id === bookingInput.serviceId
            ? {
                ...s,
                status: 'accepted' as const,
                volunteerId: bookingInput.responderId,
                volunteer: bookingInput.responder,
                appointmentTime: bookingInput.appointmentTime
              }
            : s
        )
      }));
    }

    const newMessage: Message = {
      id: 'm' + Date.now().toString(36),
      type: 'booking',
      title: bookingInput.type === 'item' ? '新的物品预约' : '新的服务接单',
      content: bookingInput.type === 'item'
        ? `${bookingInput.responder.name} 预约了「${bookingInput.item?.title || bookingInput.service?.title}」`
        : `${bookingInput.responder.name} 接单了「${bookingInput.service?.title || bookingInput.item?.title}」`,
      relatedId: id,
      senderId: bookingInput.responderId,
      sender: bookingInput.responder,
      receiverId: bookingInput.publisherId,
      receiver: bookingInput.publisher,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    set((state) => ({
      messages: [newMessage, ...state.messages],
      unreadCount: state.unreadCount + 1
    }));

    return id;
  },

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

  publisherCompleteBooking: (bookingId, photos) => {
    const state = get();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return false;
    if (booking.status === 'completed') return true;

    let isCompleted = false;
    const updates: Partial<Booking> = {
      publisherCompleted: true,
      completionPhotos: photos && photos.length > 0 ? photos : booking.completionPhotos,
    };

    if (!booking.needBothConfirm) {
      updates.status = 'completed';
      updates.responderCompleted = true;
      updates.completedAt = new Date().toISOString();
      isCompleted = true;
    }

    set({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, ...updates } : b
      )
    });

    console.log('[Store] Publisher complete booking:', bookingId, 'isCompleted:', isCompleted);
    return isCompleted;
  },

  responderConfirmComplete: (bookingId) => {
    const state = get();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return false;
    if (booking.status === 'completed') return true;

    if (!booking.needBothConfirm) {
      return booking.publisherCompleted;
    }

    let isCompleted = false;
    const updates: Partial<Booking> = {
      responderCompleted: true,
    };

    if (booking.publisherCompleted) {
      updates.status = 'completed';
      updates.completedAt = new Date().toISOString();
      isCompleted = true;
    }

    set({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, ...updates } : b
      )
    });

    console.log('[Store] Responder confirm complete booking:', bookingId, 'isCompleted:', isCompleted);
    return isCompleted;
  },

  completeBooking: (bookingId, data) => {
    const state = get();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const isPublisher = booking.publisherId === state.currentUser.id;

    const updates: Partial<Booking> = {};

    if (data.photos && data.photos.length > 0) {
      updates.completionPhotos = data.photos;
    }

    if (data.rating !== undefined) {
      if (isPublisher) {
        updates.ratingFromPublisher = data.rating;
        updates.reviewFromPublisher = data.review;
      } else {
        updates.ratingFromResponder = data.rating;
        updates.reviewFromResponder = data.review;
      }

      if (
        (booking.ratingFromPublisher !== undefined || booking.ratingFromResponder !== undefined) ||
        (data.rating !== undefined && (isPublisher ? booking.ratingFromResponder !== undefined : booking.ratingFromPublisher !== undefined))
      ) {
        const pRating = isPublisher ? data.rating : booking.ratingFromPublisher;
        const rRating = isPublisher ? booking.ratingFromResponder : data.rating;
        const allRatings = [pRating, rRating].filter(r => r !== undefined) as number[];
        if (allRatings.length > 0) {
          updates.rating = Math.round(allRatings.reduce((a, b) => a + b, 0) / allRatings.length);
        }
      } else {
        updates.rating = data.rating;
      }

      updates.tags = data.tags;
      updates.review = data.review;
    }

    set({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, ...updates } : b
      )
    });

    console.log('[Store] Complete booking with rating:', bookingId, 'isPublisher:', isPublisher);
  }
}));
