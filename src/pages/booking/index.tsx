import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import TabSegment from '@/components/TabSegment';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import { showToast, showModal } from '@/utils';
import styles from './index.module.scss';

const BookingPage: React.FC = () => {
  const {
    bookings,
    currentUser,
    confirmBooking,
    updateBooking,
    publisherCompleteBooking,
    responderConfirmComplete,
    completeBooking
  } = useAppStore();

  const [activeTab, setActiveTab] = useState(0);
  const [subTab, setSubTab] = useState(0);

  const mainTabs = ['全部预约', '我发布的', '我接单的'];
  const subTabs = ['全部状态', '待确认', '进行中', '已完成'];

  const myBookings = useMemo(() => {
    let result = bookings;

    if (activeTab === 1) {
      result = result.filter(b => b.publisherId === currentUser.id);
    } else if (activeTab === 2) {
      result = result.filter(b => b.responderId === currentUser.id);
    }

    if (subTab === 1) {
      result = result.filter(b => b.status === 'pending');
    } else if (subTab === 2) {
      result = result.filter(b => b.status === 'confirmed' || b.status === 'in_progress');
    } else if (subTab === 3) {
      result = result.filter(b => b.status === 'completed');
    }

    return result;
  }, [bookings, activeTab, subTab, currentUser.id]);

  const pendingCount = bookings.filter(b =>
    b.status === 'pending' &&
    (b.publisherId === currentUser.id || b.responderId === currentUser.id)
  ).length;

  const inProgressCount = bookings.filter(b =>
    (b.status === 'confirmed' || b.status === 'in_progress') &&
    (b.publisherId === currentUser.id || b.responderId === currentUser.id)
  ).length;

  const completedCount = bookings.filter(b =>
    b.status === 'completed' &&
    (b.publisherId === currentUser.id || b.responderId === currentUser.id)
  ).length;

  const handleConfirm = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const isPublisher = booking.publisherId === currentUser.id;
    const confirmed = await showModal(
      '确认预约',
      `您确定要${isPublisher ? '确认' : '接受'}这个预约吗？`
    );

    if (confirmed) {
      try {
        confirmBooking(bookingId, isPublisher);
        showToast('确认成功', 'success');
        console.log('[Booking] Confirmed booking:', bookingId);
      } catch (error) {
        console.error('[Booking] Confirm error:', error);
        showToast('操作失败', 'error');
      }
    }
  };

  const handlePublisherComplete = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const content = booking.needBothConfirm
      ? '您确认服务/物品已顺利交付吗？提交后等待对方确认完成。'
      : '请确认服务/物品已顺利交付，确认后将标记为完成。';

    const confirmed = await showModal(
      '确认完成',
      content
    );

    if (confirmed) {
      try {
        const isDone = publisherCompleteBooking(bookingId);
        if (isDone) {
          showToast('已完成，快去评价吧', 'success');
        } else {
          showToast('已提交，等待对方确认', 'success');
        }
        console.log('[Booking] Publisher complete booking:', bookingId);
      } catch (error) {
        console.error('[Booking] Publisher complete error:', error);
        showToast('操作失败', 'error');
      }
    }
  };

  const handleResponderConfirmComplete = async (bookingId: string) => {
    const confirmed = await showModal(
      '确认完成',
      '您确认物品已收到/服务已完成吗？双方确认后订单将标记为完成。'
    );

    if (confirmed) {
      try {
        const isDone = responderConfirmComplete(bookingId);
        if (isDone) {
          showToast('已完成，快去评价吧', 'success');
        } else {
          showToast('已确认，等待对方', 'success');
        }
        console.log('[Booking] Responder confirm complete booking:', bookingId);
      } catch (error) {
        console.error('[Booking] Responder confirm error:', error);
        showToast('操作失败', 'error');
      }
    }
  };

  const handleRate = (bookingId: string) => {
    console.log('[Booking] Rate booking:', bookingId);
    Taro.navigateTo({ url: '/pages/ranking/index?id=' + bookingId + '&mode=submit' });
  };

  const handleReport = (bookingId: string) => {
    console.log('[Booking] Report booking:', bookingId);
    Taro.navigateTo({ url: '/pages/report/index?id=' + bookingId });
  };

  const handleCancel = async (bookingId: string) => {
    const confirmed = await showModal(
      '取消预约',
      '您确定要取消这个预约吗？取消后对方会收到通知。'
    );

    if (confirmed) {
      try {
        updateBooking(bookingId, { status: 'cancelled' });
        showToast('已取消', 'success');
        console.log('[Booking] Cancelled booking:', bookingId);
      } catch (error) {
        console.error('[Booking] Cancel error:', error);
        showToast('操作失败', 'error');
      }
    }
  };

  const handleRefresh = () => {
    console.log('[Booking] Pull to refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  };

  const handleGoToSquare = () => {
    Taro.switchTab({ url: '/pages/square/index' });
  };

  return (
    <ScrollView
      scrollY
      className={styles.bookingPage}
      onScrollToLower={() => console.log('[Booking] Load more')}
    >
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>📋 我的预约</Text>
        <Text className={styles.pageSubtitle}>
          管理您的物品交换和代办服务预约
        </Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{pendingCount}</Text>
          <Text className={styles.statLabel}>待确认</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{inProgressCount}</Text>
          <Text className={styles.statLabel}>进行中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{completedCount}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
      </View>

      <View className={styles.quickActions}>
        <Button
          className={styles.actionCard}
          onClick={handleGoToSquare}
        >
          <Text className={styles.actionIcon}>🔍</Text>
          <Text className={styles.actionName}>去广场看看</Text>
        </Button>
        <Button
          className={styles.actionCard}
          onClick={() => Taro.switchTab({ url: '/pages/publish/index' })}
        >
          <Text className={styles.actionIcon}>➕</Text>
          <Text className={styles.actionName}>发布新内容</Text>
        </Button>
      </View>

      <View className={styles.tabSection}>
        <TabSegment
          tabs={mainTabs}
          activeIndex={activeTab}
          onChange={(i) => {
            setActiveTab(i);
            console.log('[Booking] Main tab:', i);
          }}
        />
      </View>

      <View className={styles.tabSection}>
        <TabSegment
          tabs={subTabs}
          activeIndex={subTab}
          onChange={(i) => {
            setSubTab(i);
            console.log('[Booking] Sub tab:', i);
          }}
        />
      </View>

      <View className={styles.listContainer}>
        {myBookings.length === 0 ? (
          <EmptyState
            icon='📋'
            title='暂无预约'
            description='还没有相关预约记录，去广场看看有没有需要的吧～'
          />
        ) : (
          myBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              currentUserId={currentUser.id}
              onConfirm={() => handleConfirm(booking.id)}
              onPublisherComplete={() => handlePublisherComplete(booking.id)}
              onResponderConfirmComplete={() => handleResponderConfirmComplete(booking.id)}
              onRate={() => handleRate(booking.id)}
              onCancel={() => handleCancel(booking.id)}
              onReport={() => handleReport(booking.id)}
            />
          ))
        )}

        {myBookings.length > 0 && (
          <View className={styles.loadingMore}>
            <Text>— 已经到底啦 —</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default BookingPage;
