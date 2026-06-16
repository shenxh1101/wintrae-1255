import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { Booking } from '@/types';
import { getBookingStatusText, getBookingStatusColor, formatDate } from '@/utils';
import RatingStars from '@/components/RatingStars';
import styles from './index.module.scss';

interface BookingCardProps {
  booking: Booking;
  currentUserId: string;
  onConfirm?: () => void;
  onPublisherComplete?: () => void;
  onResponderConfirmComplete?: () => void;
  onRate?: () => void;
  onCancel?: () => void;
  onReport?: () => void;
  onClick?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  currentUserId,
  onConfirm,
  onPublisherComplete,
  onResponderConfirmComplete,
  onRate,
  onCancel,
  onReport,
  onClick
}) => {
  const isPublisher = booking.publisherId === currentUserId;
  const otherUser = isPublisher ? booking.responder : booking.publisher;
  const title = booking.item?.title || booking.service?.title || '';
  const statusColor = getBookingStatusColor(booking.status);

  const needMyBookingConfirm = booking.needBothConfirm && (
    (isPublisher && !booking.publisherConfirmed) ||
    (!isPublisher && !booking.responderConfirmed)
  );

  const showConfirmBtn = booking.status === 'pending' && needMyBookingConfirm;
  const showPublisherCompleteBtn = (booking.status === 'confirmed' || booking.status === 'in_progress') && isPublisher && !booking.publisherCompleted;
  const showResponderConfirmBtn = booking.needBothConfirm && booking.publisherCompleted && !booking.responderCompleted && !isPublisher;
  const showWaitingResponder = booking.needBothConfirm && isPublisher && booking.publisherCompleted && !booking.responderCompleted && booking.status !== 'completed';
  const showRateBtn = booking.status === 'completed' && !(isPublisher ? booking.ratingFromPublisher : booking.ratingFromResponder);
  const showCancelBtn = booking.status === 'pending' && isPublisher;
  const showReportBtn = booking.status === 'completed' && !booking.hasReport;

  const myRating = isPublisher ? booking.ratingFromPublisher : booking.ratingFromResponder;
  const otherRating = isPublisher ? booking.ratingFromResponder : booking.ratingFromPublisher;
  const hasAnyRating = booking.ratingFromPublisher !== undefined || booking.ratingFromResponder !== undefined;

  const handleReviewDetail = () => {
    Taro.navigateTo({
      url: '/pages/ranking/index?id=' + booking.id + '&mode=view'
    });
  };

  return (
    <View className={styles.bookingCard} onClick={onClick}>
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

          {booking.completedAt && booking.status === 'completed' && (
            <View className={styles.metaRow}>
              <Text className={styles.metaLabel}>✅ 完成时间：</Text>
              <Text className={styles.metaValue}>{formatDate(booking.completedAt)}</Text>
            </View>
          )}

          {booking.needBothConfirm && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <View className={styles.confirmStatus}>
              <View className={classnames(styles.confirmItem, {
                [styles.confirmed]: booking.publisherConfirmed,
                [styles.pending]: !booking.publisherConfirmed
              })}>
                <Text>{booking.publisherConfirmed ? '✅' : '⏳'}</Text>
                <Text>发布方预约确认</Text>
              </View>
              <View className={classnames(styles.confirmItem, {
                [styles.confirmed]: booking.responderConfirmed,
                [styles.pending]: !booking.responderConfirmed
              })}>
                <Text>{booking.responderConfirmed ? '✅' : '⏳'}</Text>
                <Text>响应方预约确认</Text>
              </View>
            </View>
          )}

          {booking.needBothConfirm && (booking.status === 'in_progress' || booking.publisherCompleted || booking.responderCompleted) && booking.status !== 'completed' && (
            <View className={styles.confirmStatus}>
              <View className={classnames(styles.confirmItem, {
                [styles.confirmed]: booking.publisherCompleted,
                [styles.pending]: !booking.publisherCompleted
              })}>
                <Text>{booking.publisherCompleted ? '✅' : '⏳'}</Text>
                <Text>发布方完成确认</Text>
              </View>
              <View className={classnames(styles.confirmItem, {
                [styles.confirmed]: booking.responderCompleted,
                [styles.pending]: !booking.responderCompleted
              })}>
                <Text>{booking.responderCompleted ? '✅' : '⏳'}</Text>
                <Text>响应方完成确认</Text>
              </View>
            </View>
          )}

          {booking.needBothConfirm && (
            <View className={styles.dualNotice}>
              <Text>🔒 贵重物品/服务，需双方确认后完成</Text>
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

      {booking.status === 'completed' && hasAnyRating && (
        <View className={styles.ratingSummary} onClick={(e) => { e.stopPropagation(); handleReviewDetail(); }}>
          <View className={styles.ratingSummaryHeader}>
            <Text className={styles.ratingLabel}>⭐ 双方评价</Text>
            <Text className={styles.viewDetailHint}>查看详情 ›</Text>
          </View>
          {booking.ratingFromPublisher !== undefined && (
            <View className={styles.ratingPartyRow}>
              <Text className={styles.ratingPartyLabel}>发布方</Text>
              <RatingStars rating={booking.ratingFromPublisher} size={16} />
              <Text className={styles.ratingPartyScore}>{booking.ratingFromPublisher}.0</Text>
              {booking.reviewFromPublisher && (
                <Text className={styles.ratingPartyReview} numberOfLines={1}>"{booking.reviewFromPublisher}"</Text>
              )}
            </View>
          )}
          {booking.ratingFromResponder !== undefined && (
            <View className={styles.ratingPartyRow}>
              <Text className={styles.ratingPartyLabel}>响应方</Text>
              <RatingStars rating={booking.ratingFromResponder} size={16} />
              <Text className={styles.ratingPartyScore}>{booking.ratingFromResponder}.0</Text>
              {booking.reviewFromResponder && (
                <Text className={styles.ratingPartyReview} numberOfLines={1}>"{booking.reviewFromResponder}"</Text>
              )}
            </View>
          )}
          {booking.completionPhotos && booking.completionPhotos.length > 0 && (
            <View className={styles.ratingPhotoHint}>
              <Text className={styles.ratingPhotoText}>📷 {booking.completionPhotos.length} 张照片</Text>
            </View>
          )}
        </View>
      )}

      {booking.status === 'completed' && !hasAnyRating && !myRating && (
        <View className={styles.rateHint}>
          <Text className={styles.rateHintText}>
            💡 服务已完成，快来给{otherUser.name}打个分吧~
          </Text>
        </View>
      )}

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
        {showPublisherCompleteBtn && (
          <Button className={classnames(styles.actionBtn, styles.success)} onClick={onPublisherComplete}>
            确认完成
          </Button>
        )}
        {showResponderConfirmBtn && (
          <Button className={classnames(styles.actionBtn, styles.success)} onClick={onResponderConfirmComplete}>
            确认完成
          </Button>
        )}
        {showWaitingResponder && (
          <View className={styles.waitingConfirm}>
            <Text className={styles.waitingText}>⏳ 等待对方确认完成</Text>
          </View>
        )}
        {showRateBtn && (
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={onRate}>
            去评价
          </Button>
        )}
        {myRating !== undefined && booking.status === 'completed' && !showRateBtn && (
          <View className={styles.ratedBadge}>
            <Text>⭐ 我已评价 {myRating} 分</Text>
          </View>
        )}
        {showReportBtn && onReport && (
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={onReport}>
            爽约反馈
          </Button>
        )}
      </View>
    </View>
  );
};

export default BookingCard;
