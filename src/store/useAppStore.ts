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
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'completionPhotos' | 'publisherConfirmed' | 'responderConfirmed'>) => string;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  markMessageRead: (messageId: string) => void;
  confirmBooking: (bookingId: string, isPublisher: boolean) => void;
  completeBooking: (bookingId: string, data: { photos?: string[]; rating?: number; review?: string; tags?: string[] }) => void;
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

  addBooking: (bookingInput) => {
    const id = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newBooking: Booking = {
      ...bookingInput,
      id,
      completionPhotos: [],
      publisherConfirmed: bookingInput.status === 'confirmed',
      responderConfirmed: bookingInput.status === 'confirmed',
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

  completeBooking: (bookingId, data) => set((state) => ({
    bookings: state.bookings.map(b =>
      b.id === bookingId
        ? {
            ...b,
            status: 'completed' as const,
            completionPhotos: data.photos || b.completionPhotos,
            rating: data.rating,
            review: data.review,
            completedAt: new Date().toISOString()
          }
        : b
    )
  }))
}));
