import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import { Message } from '@/types';
import { getMessageTypeColor, formatDate } from '@/utils';
import styles from './index.module.scss';

interface MessageItemProps {
  message: Message;
  onClick?: () => void;
  unreadCount?: number;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onClick, unreadCount = 0 }) => {
  const iconMap: Record<string, string> = {
    system: '🔔',
    booking: '📋',
    chat: '💬',
    credit: '💳'
  };

  const bgColor = getMessageTypeColor(message.type);

  if (message.type === 'chat' && message.sender) {
    return (
      <View
        className={classnames(styles.messageItem, {
          [styles.unread]: !message.isRead
        })}
        onClick={onClick}
      >
        <View className={styles.avatarWrapper}>
          <Image
            className={styles.avatar}
            src={message.sender.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[MessageItem] Avatar error:', e)}
          />
          {unreadCount > 0 && (
            <Text className={styles.avatarUnread}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          )}
        </View>
        <View className={styles.messageContent}>
          <View className={styles.messageHeader}>
            <Text className={styles.messageTitle}>{message.title}</Text>
            <Text className={styles.messageTime}>{formatDate(message.createdAt)}</Text>
          </View>
          <Text className={styles.messageBody}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className={classnames(styles.messageItem, {
        [styles.unread]: !message.isRead
      })}
      onClick={onClick}
    >
      <View
        className={styles.iconWrapper}
        style={{ backgroundColor: `${bgColor}15` }}
      >
        <Text className={styles.icon}>{iconMap[message.type] || '📩'}</Text>
      </View>
      <View className={styles.messageContent}>
        <View className={styles.messageHeader}>
          <Text className={styles.messageTitle}>{message.title}</Text>
          {!message.isRead && <View className={styles.unreadDot} />}
          <Text className={styles.messageTime}>{formatDate(message.createdAt)}</Text>
        </View>
        <Text className={styles.messageBody}>{message.content}</Text>
      </View>
    </View>
  );
};

export default MessageItem;
