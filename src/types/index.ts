export type ItemType = 'exchange' | 'needed';
export type ServiceType = 'errand' | 'helper';
export type PublishType = 'item' | 'service';
export type DeliveryType = 'pickup' | 'delivery' | 'both';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type MessageType = 'system' | 'booking' | 'chat';

export interface User {
  id: string;
  name: string;
  avatar: string;
  building: string;
  unit: string;
  rating: number;
  exchangeCount: number;
  isVolunteer: boolean;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  images: string[];
  category: string;
  deliveryType: DeliveryType;
  timeSlots: string[];
  building: string;
  unit: string;
  publisherId: string;
  publisher: User;
  isValuable: boolean;
  needBothConfirm: boolean;
  createdAt: string;
  status: 'available' | 'reserved' | 'exchanged';
}

export interface Service {
  id: string;
  type: ServiceType;
  title: string;
  description: string;
  images: string[];
  category: string;
  estimatedTime: string;
  building: string;
  unit: string;
  publisherId: string;
  publisher: User;
  volunteerId?: string;
  volunteer?: User;
  appointmentTime?: string;
  isValuable: boolean;
  needBothConfirm: boolean;
  completionPhotos: string[];
  createdAt: string;
  status: 'open' | 'accepted' | 'in_progress' | 'completed';
}

export interface Booking {
  id: string;
  itemId?: string;
  serviceId?: string;
  item?: Item;
  service?: Service;
  publisherId: string;
  publisher: User;
  responderId: string;
  responder: User;
  appointmentTime: string;
  status: BookingStatus;
  needBothConfirm: boolean;
  publisherConfirmed: boolean;
  responderConfirmed: boolean;
  completionPhotos: string[];
  rating?: number;
  review?: string;
  createdAt: string;
  type: 'item' | 'service';
}

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  relatedId?: string;
  senderId?: string;
  sender?: User;
  receiverId?: string;
  receiver?: User;
  isRead: boolean;
  createdAt: string;
}

export interface Community {
  name: string;
  buildings: string[];
}

export interface LeaderboardItem {
  userId: string;
  user: User;
  exchangeCount: number;
  serviceCount: number;
  totalScore: number;
  rank: number;
}

export interface FavoriteContact {
  id: string;
  userId: string;
  contact: User;
  createdAt: string;
}
