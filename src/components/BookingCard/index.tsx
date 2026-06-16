import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import { Booking } from '@/types';
import { getBookingStatusText, getBookingStatusColor, formatDate } from '@/utils';
import styles from './index.module.scss';

interface BookingCardProps {
  booking: Booking;
  currentUserId: string;
  onConfirm?: () => void;
  onComplete?: () => void;
  onRate?: () => void;
  onCancel?: () => void;
  onReport?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  currentUserId,
  onConfirm,
  onComplete,
  onRate,
  onCancel,
  onReport
}) => {
  const isPublisher = booking.publisherId === currentUserId;
  const title = booking.item?.title || booking.service?.title || '';
  const statusColor = getBookingStatusColor(booking.status);
  const needMyConfirm = booking.needBothConfirm && (
    (isPublisher && !booking.publisherConfirmed) ||
    (!isPublisher && !booking.responderConfirmed)
  );

  const showConfirmBtn = booking.status === 'pending' && needMyConfirm;
  const showCompleteBtn = booking.status === 'confirmed' || booking.status === 'in_progress';
  const showRateBtn = booking.status === 'completed' && !booking.rating;
  const showCancelBtn = booking.status === 'pending' && isPublisher;
  const showReportBtn = booking.status === 'completed' && !booking.hasReport;

  return (
    <View className={styles.bookingCard}>
      <View className={styles.cardHeader}>
        <Text className={classnames(styles.typeTag, {
          [styles.item]: booking.type === 'item',
          [styles.service]: booking.type === 'service'
        })}>
          {booking.type === 'item' ? '📦 物品交换' : '🛠️ 代办服务'}
        </Text>
        <Text className={styles.statusBadge} style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>
          {getBookingStatusText(booking.status)}
        </Text>
      </View>

      <View className={styles.cardContent}>
        <Text className={styles.bookingTitle}>{title}</Text>
        <View className={styles.bookingMeta}>
          <View className={styles.metaRow}>
            <Text className={styles.metaLabel}>⏰ 预约时间：</Text>
            <Text className={styles.metaValue}>{booking.appointmentTime}</Text>
          </View>
          {booking.needBothConfirm && (
            <View className={styles.confirmStatus}>
              <View className={classnames(styles.confirmItem, {
                [styles.confirmed]: booking.publisherConfirmed,
                [styles.pending]: !booking.publisherConfirmed
              })}>
                <Text>{booking.publisherConfirmed ? '✅' : '⏳'}</Text>
                <Text>发布方确认</Text>
              </View>
              <View className={classnames(styles.confirmItem, {
                [styles.confirmed]: booking.responderConfirmed,
                [styles.pending]: !booking.responderConfirmed
              })}>
                <Text>{booking.responderConfirmed ? '✅' : '⏳'}</Text>
                <Text>响应方确认</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.participants}>
        <View className={styles.participant}>
          <Image
            className={styles.avatar}
            src={booking.publisher.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[BookingCard] Publisher avatar error:', e)}
          />
          <View className={styles.participantInfo}>
            <Text className={styles.participantName}>{booking.publisher.name}</Text>
            <Text className={styles.participantRole}>发布方</Text>
          </View>
        </View>
        <Text className={styles.arrow}>→</Text>
        <View className={styles.participant}>
          <Image
            className={styles.avatar}
            src={booking.responder.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[BookingCard] Responder avatar error:', e)}
          />
          <View className={styles.participantInfo}>
            <Text className={styles.participantName}>{booking.responder.name}</Text>
            <Text className={styles.participantRole}>响应方</Text>
          </View>
        </View>
      </View>

      <View className={styles.cardActions}>
        {showCancelBtn && (
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={onCancel}>
            取消预约
          </Button>
        )}
        {showConfirmBtn && (
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={onConfirm}>
            确认预约
          </Button>
        )}
        {showCompleteBtn && isPublisher && (
          <Button className={classnames(styles.actionBtn, styles.success)} onClick={onComplete}>
            确认完成
          </Button>
        )}
        {showRateBtn && (
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={onRate}>
            去评价
          </Button>
        )}
        {showReportBtn && onReport && (
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={onReport}>
            爽约反馈
          </Button>
        )}
        {booking.rating && (
          <View style={{ flex: 1, textAlign: 'center', color: '#16A34A', fontSize: 24 }}>
            ⭐ 已评价 {booking.rating} 分
          </View>
        )}
      </View>
    </View>
  );
};

export default BookingCard;
