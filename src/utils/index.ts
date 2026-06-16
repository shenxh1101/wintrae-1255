import Taro from '@tarojs/taro';
import { DeliveryType, BookingStatus, MessageType } from '@/types';

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const getDeliveryTypeText = (type: DeliveryType): string => {
  const map = {
    pickup: '仅自提',
    delivery: '可送达',
    both: '自提/送达'
  };
  return map[type];
};

export const getBookingStatusText = (status: BookingStatus): string => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status];
};

export const getBookingStatusColor = (status: BookingStatus): string => {
  const map = {
    pending: '#FF7D00',
    confirmed: '#1890FF',
    in_progress: '#52C41A',
    completed: '#86909C',
    cancelled: '#F53F3F'
  };
  return map[status];
};

export const getMessageTypeText = (type: MessageType): string => {
  const map = {
    system: '系统通知',
    booking: '预约通知',
    chat: '聊天消息'
  };
  return map[type];
};

export const getMessageTypeColor = (type: MessageType): string => {
  const map = {
    system: '#165DFF',
    booking: '#FF8A3D',
    chat: '#52C41A'
  };
  return map[type];
};

export const showToast = (title: string, icon: 'success' | 'error' | 'none' = 'none'): void => {
  Taro.showToast({
    title,
    icon,
    duration: 2000
  });
};

export const showModal = (title: string, content: string): Promise<boolean> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false)
    });
  });
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getRankBadge = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
};
