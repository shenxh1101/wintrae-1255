import { Message } from '@/types';
import { mockUsers, mockCurrentUser } from './mockUsers';

export const mockMessages: Message[] = [
  {
    id: 'm001',
    type: 'system',
    title: '欢迎使用社区互助',
    content: '欢迎加入阳光花园社区！在这里您可以发布闲置物品交换、预约上门代办服务，与邻里互助共赢。',
    isRead: true,
    createdAt: '2026-06-01 10:00'
  },
  {
    id: 'm002',
    type: 'booking',
    title: '新的预约请求',
    content: '张小明向您预约了"九成新电饭煲转让"，时间为6月16日19:00，请及时确认。',
    relatedId: 'b001',
    senderId: 'u001',
    sender: mockCurrentUser,
    receiverId: 'u002',
    receiver: mockUsers[1],
    isRead: false,
    createdAt: '2026-06-15 15:00'
  },
  {
    id: 'm003',
    type: 'chat',
    title: '李阿姨',
    content: '好的，明天下午我在家，你直接过来取就可以了。',
    relatedId: 'i001',
    senderId: 'u002',
    sender: mockUsers[1],
    receiverId: 'u001',
    receiver: mockCurrentUser,
    isRead: true,
    createdAt: '2026-06-15 15:30'
  },
  {
    id: 'm004',
    type: 'booking',
    title: '预约已确认',
    content: '您的预约"帮忙代购生活用品"已被刘小姐确认，时间为6月16日10:00。',
    relatedId: 'b002',
    senderId: 'u004',
    sender: mockUsers[3],
    receiverId: 'u003',
    receiver: mockUsers[2],
    isRead: false,
    createdAt: '2026-06-15 11:00'
  },
  {
    id: 'm005',
    type: 'system',
    title: '互助榜更新提醒',
    content: '本月社区互助榜已更新，您排名第5位，继续加油！',
    isRead: true,
    createdAt: '2026-06-14 09:00'
  },
  {
    id: 'm006',
    type: 'chat',
    title: '刘小姐',
    content: '请问需要买哪些东西？可以把清单发给我吗？',
    relatedId: 's003',
    senderId: 'u004',
    sender: mockUsers[3],
    receiverId: 'u003',
    receiver: mockUsers[2],
    isRead: false,
    createdAt: '2026-06-15 11:30'
  },
  {
    id: 'm007',
    type: 'booking',
    title: '贵重物品待确认',
    content: '您预约了"iPad 2021 64G 换物"，这是贵重物品，请您确认预约信息。',
    relatedId: 'b003',
    senderId: 'u004',
    sender: mockUsers[3],
    receiverId: 'u001',
    receiver: mockCurrentUser,
    isRead: false,
    createdAt: '2026-06-15 21:00'
  },
  {
    id: 'm008',
    type: 'system',
    title: '服务完成提醒',
    content: '您的服务"保洁阿姨帮忙打扫卫生"已完成，记得给服务打分评价哦！',
    relatedId: 'b006',
    isRead: true,
    createdAt: '2026-06-15 12:00'
  },
  {
    id: 'm009',
    type: 'chat',
    title: '赵奶奶',
    content: '谢谢你上次帮我取快递，太感谢了！',
    relatedId: 's001',
    senderId: 'u006',
    sender: mockUsers[5],
    receiverId: 'u001',
    receiver: mockCurrentUser,
    isRead: true,
    createdAt: '2026-06-13 18:00'
  },
  {
    id: 'm010',
    type: 'booking',
    title: '服务已接单',
    content: '郑师傅已接单"需要电工师傅维修"，请确认上门时间。',
    relatedId: 'b004',
    senderId: 'u010',
    sender: mockUsers[9],
    receiverId: 'u004',
    receiver: mockUsers[3],
    isRead: true,
    createdAt: '2026-06-15 09:00'
  },
  {
    id: 'm011',
    type: 'credit',
    title: '对方已确认完成',
    content: '赵奶奶 已确认「保洁阿姨帮忙打扫卫生」完成，快去评价吧！',
    relatedId: 'b006',
    senderId: 'u006',
    sender: mockUsers[5],
    receiverId: 'u001',
    receiver: mockCurrentUser,
    isRead: false,
    createdAt: '2026-06-15 12:30'
  },
  {
    id: 'm012',
    type: 'credit',
    title: '收到新评价',
    content: '李阿姨 对「Switch健身环+游戏卡带」给出了 5 星评价',
    relatedId: 'b005',
    senderId: 'u002',
    sender: mockUsers[1],
    receiverId: 'u001',
    receiver: mockCurrentUser,
    isRead: false,
    createdAt: '2026-06-15 22:30'
  },
  {
    id: 'm013',
    type: 'credit',
    title: '爽约反馈已处理',
    content: '您发起的爽约反馈已处理完毕，对方信用分已扣除。',
    relatedId: 'b008',
    senderId: 'u007',
    sender: mockUsers[6],
    receiverId: 'u001',
    receiver: mockCurrentUser,
    isRead: true,
    createdAt: '2026-06-14 10:00'
  }
];

export const getUnreadCount = (userId: string) =>
  mockMessages.filter(m =>
    (m.receiverId === userId || (!m.receiverId && m.type === 'system')) &&
    !m.isRead
  ).length;

export const getSystemMessages = () => mockMessages.filter(m => m.type === 'system');
export const getBookingMessages = () => mockMessages.filter(m => m.type === 'booking');
export const getChatMessages = () => mockMessages.filter(m => m.type === 'chat');
