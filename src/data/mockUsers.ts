import { User, Community } from '@/types';

export const mockCurrentUser: User = {
  id: 'u001',
  name: '张小明',
  avatar: 'https://picsum.photos/id/64/200/200',
  building: '3栋',
  unit: '2单元',
  rating: 4.8,
  exchangeCount: 15,
  isVolunteer: true
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'u002',
    name: '李阿姨',
    avatar: 'https://picsum.photos/id/91/200/200',
    building: '1栋',
    unit: '1单元',
    rating: 4.9,
    exchangeCount: 28,
    isVolunteer: true
  },
  {
    id: 'u003',
    name: '王大叔',
    avatar: 'https://picsum.photos/id/177/200/200',
    building: '2栋',
    unit: '3单元',
    rating: 4.7,
    exchangeCount: 12,
    isVolunteer: false
  },
  {
    id: 'u004',
    name: '刘小姐',
    avatar: 'https://picsum.photos/id/338/200/200',
    building: '5栋',
    unit: '2单元',
    rating: 4.6,
    exchangeCount: 8,
    isVolunteer: true
  },
  {
    id: 'u005',
    name: '陈先生',
    avatar: 'https://picsum.photos/id/1027/200/200',
    building: '4栋',
    unit: '1单元',
    rating: 4.5,
    exchangeCount: 20,
    isVolunteer: false
  },
  {
    id: 'u006',
    name: '赵奶奶',
    avatar: 'https://picsum.photos/id/659/200/200',
    building: '1栋',
    unit: '2单元',
    rating: 5.0,
    exchangeCount: 35,
    isVolunteer: true
  },
  {
    id: 'u007',
    name: '孙大哥',
    avatar: 'https://picsum.photos/id/718/200/200',
    building: '6栋',
    unit: '1单元',
    rating: 4.4,
    exchangeCount: 6,
    isVolunteer: false
  },
  {
    id: 'u008',
    name: '周女士',
    avatar: 'https://picsum.photos/id/783/200/200',
    building: '3栋',
    unit: '1单元',
    rating: 4.8,
    exchangeCount: 18,
    isVolunteer: true
  },
  {
    id: 'u009',
    name: '吴同学',
    avatar: 'https://picsum.photos/id/1025/200/200',
    building: '2栋',
    unit: '1单元',
    rating: 4.3,
    exchangeCount: 5,
    isVolunteer: false
  },
  {
    id: 'u010',
    name: '郑师傅',
    avatar: 'https://picsum.photos/id/237/200/200',
    building: '5栋',
    unit: '1单元',
    rating: 4.9,
    exchangeCount: 42,
    isVolunteer: true
  }
];

export const mockCommunity: Community = {
  name: '阳光花园社区',
  buildings: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋']
};

export const getItemCategories = (): string[] => [
  '家用电器', '厨房用品', '图书文具', '儿童玩具',
  '运动器材', '数码产品', '家居装饰', '其他'
];

export const getServiceCategories = (): string[] => [
  '跑腿代购', '取件送货', '家政保洁', '维修安装',
  '老人陪护', '临时照看', '宠物照料', '其他'
];

export const getTimeSlots = (): string[] => [
  '08:00-10:00', '10:00-12:00', '14:00-16:00',
  '16:00-18:00', '18:00-20:00', '20:00-22:00'
];
