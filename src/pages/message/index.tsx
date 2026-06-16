import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import TabSegment from '@/components/TabSegment';
import MessageItem from '@/components/MessageItem';
import EmptyState from '@/components/EmptyState';
import { showToast, showModal } from '@/utils';
import styles from './index.module.scss';

const MessagePage: React.FC = () => {
  const { messages, unreadCount, currentUser, markMessageRead } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['全部消息', '系统通知', '预约通知', '信用提醒', '聊天消息'];

  const filteredMessages = useMemo(() => {
    let result = messages.filter(m =>
      m.receiverId === currentUser.id || m.type === 'system'
    );

    if (activeTab === 1) {
      result = result.filter(m => m.type === 'system');
    } else if (activeTab === 2) {
      result = result.filter(m => m.type === 'booking');
    } else if (activeTab === 3) {
      result = result.filter(m => m.type === 'credit');
    } else if (activeTab === 4) {
      result = result.filter(m => m.type === 'chat');
    }

    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages, activeTab, currentUser.id]);

  const handleMessageClick = (message: any) => {
    console.log('[Message] Message clicked:', message.id);

    if (!message.isRead) {
      markMessageRead(message.id);
    }

    if (message.relatedId) {
      if (message.type === 'booking') {
        Taro.switchTab({ url: '/pages/booking/index' });
      } else if (message.type === 'credit') {
        if (message.title === '收到新评价') {
          Taro.navigateTo({ url: '/pages/ranking/index?id=' + message.relatedId + '&mode=view' });
        } else if (message.title === '对方已确认完成') {
          Taro.navigateTo({ url: '/pages/ranking/index?id=' + message.relatedId + '&mode=submit' });
        } else {
          Taro.navigateTo({ url: '/pages/credit/index' });
        }
      } else if (message.type === 'chat') {
        showToast('聊天功能开发中');
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      showToast('暂无未读消息');
      return;
    }

    const confirmed = await showModal(
      '全部已读',
      `确定将所有 ${unreadCount} 条未读消息标记为已读吗？`
    );

    if (confirmed) {
      try {
        messages.forEach(m => {
          if (!m.isRead) {
            markMessageRead(m.id);
          }
        });
        showToast('已全部标记为已读', 'success');
        console.log('[Message] Marked all as read');
      } catch (error) {
        console.error('[Message] Mark all read error:', error);
        showToast('操作失败', 'error');
      }
    }
  };

  const handleClearAll = async () => {
    const confirmed = await showModal(
      '清空消息',
      '确定要清空所有消息吗？此操作不可撤销。'
    );

    if (confirmed) {
      showToast('已清空', 'success');
      console.log('[Message] Cleared all messages');
    }
  };

  const getUnreadByType = (type: string) => {
    return messages.filter(m =>
      !m.isRead &&
      (m.receiverId === currentUser.id || m.type === 'system') &&
      (type === 'all' || m.type === type)
    ).length;
  };

  return (
    <ScrollView
      scrollY
      className={styles.messagePage}
      onScrollToLower={() => console.log('[Message] Load more')}
    >
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>
          💬 消息中心
          {unreadCount > 0 && (
            <Text className={styles.unreadBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          )}
        </Text>
        <Text className={styles.pageSubtitle}>
          查看您的系统通知和预约消息
        </Text>
      </View>

      <View className={styles.quickActions}>
        <Button
          className={styles.actionCard}
          onClick={() => {
            setActiveTab(1);
            console.log('[Message] System messages');
          }}
        >
          <View className={styles.actionIcon} style={{ background: 'rgba(22, 93, 255, 0.1)' }}>
            🔔
          </View>
          <View className={styles.actionText}>
            <Text className={styles.actionName}>系统通知</Text>
            <Text className={styles.actionDesc}>
              {getUnreadByType('system') > 0 ? `${getUnreadByType('system')} 条未读` : '暂无新消息'}
            </Text>
          </View>
        </Button>
        <Button
          className={styles.actionCard}
          onClick={() => {
            setActiveTab(2);
            console.log('[Message] Booking messages');
          }}
        >
          <View className={styles.actionIcon} style={{ background: 'rgba(255, 138, 61, 0.1)' }}>
            📋
          </View>
          <View className={styles.actionText}>
            <Text className={styles.actionName}>预约通知</Text>
            <Text className={styles.actionDesc}>
              {getUnreadByType('booking') > 0 ? `${getUnreadByType('booking')} 条未读` : '暂无新消息'}
            </Text>
          </View>
        </Button>
        <Button
          className={styles.actionCard}
          onClick={() => {
            setActiveTab(3);
            console.log('[Message] Credit messages');
          }}
        >
          <View className={styles.actionIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
            💳
          </View>
          <View className={styles.actionText}>
            <Text className={styles.actionName}>信用提醒</Text>
            <Text className={styles.actionDesc}>
              {getUnreadByType('credit') > 0 ? `${getUnreadByType('credit')} 条未读` : '暂无新消息'}
            </Text>
          </View>
        </Button>
      </View>

      <View className={styles.tabSection}>
        <TabSegment
          tabs={tabs}
          activeIndex={activeTab}
          onChange={(i) => {
            setActiveTab(i);
            console.log('[Message] Tab changed:', i);
          }}
        />
      </View>

      <Button
        className={styles.markAllRead}
        onClick={handleMarkAllRead}
      >
        全部标记为已读
      </Button>

      <View className={styles.listContainer}>
        {filteredMessages.length === 0 ? (
          <EmptyState
            icon='💬'
            title='暂无消息'
            description='还没有相关消息，有新消息会第一时间通知您～'
          />
        ) : (
          filteredMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onClick={() => handleMessageClick(message)}
              unreadCount={message.type === 'chat' ? getUnreadByType('chat') : 0}
            />
          ))
        )}

        {filteredMessages.length > 0 && (
          <View className={styles.loadingMore}>
            <Text>— 已经到底啦 —</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MessagePage;
