import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import RatingStars from '@/components/RatingStars';
import TabSegment from '@/components/TabSegment';
import { formatDate } from '@/utils';
import styles from './index.module.scss';

const CreditPage: React.FC = () => {
  const { bookings, currentUser } = useAppStore();
  const [timeRange, setTimeRange] = useState<'month' | 'all'>('all');
  const [activeTab, setActiveTab] = useState(0);
  const [receivedReports, setReceivedReports] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);

  const tabs = ['收到的评价', '我发起的反馈', '我收到的反馈'];

  useEffect(() => {
    try {
      const saved = Taro.getStorageSync('reports');
      if (saved) {
        const allReports = JSON.parse(saved);
        const my = allReports.filter((r: any) => r.reporterId === currentUser.id);
        const received = allReports.filter((r: any) => r.reportedUserId === currentUser.id);
        setMyReports(my);
        setReceivedReports(received);
      }
    } catch (e) {
      console.error('[Credit] Load reports error:', e);
    }
  }, [currentUser.id]);

  const timeRangeStart = useMemo(() => {
    if (timeRange === 'all') return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }, [timeRange]);

  const myCompletedBookings = useMemo(() => {
    return bookings.filter(b =>
      b.status === 'completed' &&
      (b.publisherId === currentUser.id || b.responderId === currentUser.id)
    ).filter(b => {
      if (!timeRangeStart || !b.completedAt) return true;
      return new Date(b.completedAt) >= timeRangeStart;
    });
  }, [bookings, currentUser.id, timeRangeStart]);

  const receivedRatings = useMemo(() => {
    return myCompletedBookings
      .filter(b => {
        const rating = b.publisherId === currentUser.id ? b.ratingFromResponder : b.ratingFromPublisher;
        return rating !== undefined;
      })
      .map(b => {
        const isPublisher = b.publisherId === currentUser.id;
        return {
          bookingId: b.id,
          fromUser: isPublisher ? b.responder : b.publisher,
          rating: isPublisher ? b.ratingFromResponder : b.ratingFromPublisher,
          review: isPublisher ? b.reviewFromResponder : b.reviewFromPublisher,
          tags: b.tags,
          date: b.completedAt || b.createdAt
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [myCompletedBookings, currentUser.id]);

  const avgRating = useMemo(() => {
    if (receivedRatings.length === 0) return currentUser.rating;
    const sum = receivedRatings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / receivedRatings.length) * 10) / 10;
  }, [receivedRatings, currentUser.rating]);

  const creditScore = useMemo(() => {
    const base = 500;
    const ratingBonus = Math.round(avgRating * 50);
    const exchangeBonus = Math.min(currentUser.exchangeCount * 5, 200);
    const reportDeduction = receivedReports.filter(r => r.status === 'approved').length * 50;
    return Math.max(350, Math.min(950, base + ratingBonus + exchangeBonus - reportDeduction));
  }, [avgRating, currentUser.exchangeCount, receivedReports]);

  const creditLevel = useMemo(() => {
    if (creditScore >= 850) return '🌟 极好';
    if (creditScore >= 750) return '⭐ 优秀';
    if (creditScore >= 650) return '👍 良好';
    if (creditScore >= 550) return '😊 一般';
    return '⚠️ 较低';
  }, [creditScore]);

  const myReportsFiltered = useMemo(() => {
    if (!timeRangeStart) return myReports;
    return myReports.filter(r => new Date(r.createdAt) >= timeRangeStart);
  }, [myReports, timeRangeStart]);

  const receivedReportsFiltered = useMemo(() => {
    if (!timeRangeStart) return receivedReports;
    return receivedReports.filter(r => new Date(r.createdAt) >= timeRangeStart);
  }, [receivedReports, timeRangeStart]);

  const handleTimeChange = (range: 'month' | 'all') => {
    setTimeRange(range);
    console.log('[Credit] Time range changed:', range);
  };

  const getReportStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '审核中';
      case 'approved': return '已处理';
      case 'rejected': return '已驳回';
      default: return '未知';
    }
  };

  const getReportStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      default: return '';
    }
  };

  const handleGoToRate = () => {
    Taro.navigateTo({ url: '/pages/ranking/index?mode=view' });
  };

  const handleGoToReport = () => {
    Taro.navigateTo({ url: '/pages/report/index?mode=select' });
  };

  const renderRatings = () => {
    if (receivedRatings.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>⭐</Text>
          <Text className={styles.emptyText}>暂无评价记录</Text>
        </View>
      );
    }

    return receivedRatings.map(r => (
      <View key={r.bookingId} className={styles.recordItem}>
        <View className={styles.recordHeader}>
          <View className={styles.recordUser}>
            <Image
              className={styles.recordAvatar}
              src={r.fromUser.avatar}
              mode='aspectFill'
            />
            <View className={styles.recordUserInfo}>
              <Text className={styles.recordUserName}>{r.fromUser.name}</Text>
              <Text className={styles.recordUserRole}>
                {r.fromUser.building} · {r.fromUser.unit}
              </Text>
            </View>
          </View>
          <View className={styles.recordScore}>
            <RatingStars rating={r.rating || 0} size={20} />
          </View>
        </View>
        {r.review && (
          <Text className={styles.recordContent}>"{r.review}"</Text>
        )}
        {r.tags && r.tags.length > 0 && (
          <View className={styles.recordTags}>
            {r.tags.map(tag => (
              <Text key={tag} className={styles.recordTag}>{tag}</Text>
            ))}
          </View>
        )}
        <Text className={styles.recordTime}>{formatDate(r.date)}</Text>
      </View>
    ));
  };

  const renderMyReports = () => {
    if (myReportsFiltered.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📝</Text>
          <Text className={styles.emptyText}>暂无反馈记录</Text>
        </View>
      );
    }

    return myReportsFiltered.map(r => (
      <View key={r.id} className={styles.reportItem}>
        <View className={styles.reportHeader}>
          <Text className={styles.reportUser}>被举报人：{r.reportedUser?.name || '匿名'}</Text>
          <Text className={`${styles.reportStatus} ${getReportStatusClass(r.status)}`}>
            {getReportStatusText(r.status)}
          </Text>
        </View>
        <Text className={styles.reportReason}>原因：{r.reason}</Text>
        {r.description && (
          <Text className={styles.reportDesc}>{r.description}</Text>
        )}
        <Text className={styles.reportTime}>{formatDate(r.createdAt)}</Text>
      </View>
    ));
  };

  const renderReceivedReports = () => {
    if (receivedReportsFiltered.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>您还没有被举报过，继续保持~</Text>
        </View>
      );
    }

    return receivedReportsFiltered.map(r => (
      <View key={r.id} className={styles.reportItem}>
        <View className={styles.reportHeader}>
          <Text className={styles.reportUser}>举报人：{r.reporterId ? '邻居用户' : '匿名'}</Text>
          <Text className={`${styles.reportStatus} ${getReportStatusClass(r.status)}`}>
            {getReportStatusText(r.status)}
          </Text>
        </View>
        <Text className={styles.reportReason}>原因：{r.reason}</Text>
        {r.description && (
          <Text className={styles.reportDesc}>{r.description}</Text>
        )}
        <Text className={styles.reportTime}>{formatDate(r.createdAt)}</Text>
      </View>
    ));
  };

  return (
    <ScrollView scrollY className={styles.creditPage}>
      <View className={styles.header}>
        <Text className={styles.creditScore}>{creditScore}</Text>
        <Text className={styles.creditLabel}>信用分</Text>
        <Text className={styles.creditLevel}>{creditLevel}</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{receivedRatings.length}</Text>
          <Text className={styles.statLabel}>收到评价</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{myReportsFiltered.length}</Text>
          <Text className={styles.statLabel}>我发起的</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{receivedReportsFiltered.length}</Text>
          <Text className={styles.statLabel}>我收到的</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{avgRating.toFixed(1)}</Text>
          <Text className={styles.statLabel}>平均评分</Text>
        </View>
      </View>

      <View className={styles.timeFilter}>
        <Button
          className={`${styles.timeBtn} ${timeRange === 'month' ? styles.active : ''}`}
          onClick={() => handleTimeChange('month')}
        >
          最近一个月
        </Button>
        <Button
          className={`${styles.timeBtn} ${timeRange === 'all' ? styles.active : ''}`}
          onClick={() => handleTimeChange('all')}
        >
          全部时间
        </Button>
      </View>

      <View style={{ padding: '0 32rpx' }}>
        <TabSegment
          tabs={tabs}
          activeIndex={activeTab}
          onChange={(i) => {
            setActiveTab(i);
            console.log('[Credit] Tab changed:', i);
          }}
        />
      </View>

      <View className={styles.sectionCard}>
        {activeTab === 0 && renderRatings()}
        {activeTab === 1 && renderMyReports()}
        {activeTab === 2 && renderReceivedReports()}
      </View>

      <View style={{ padding: '0 32rpx', display: 'flex', gap: 24, marginTop: 16 }}>
        <Button
          style={{
            flex: 1,
            height: 88,
            borderRadius: 12,
            background: '#FF8A3D',
            color: '#fff',
            fontSize: 28,
            fontWeight: 500
          }}
          onClick={handleGoToRate}
        >
          ⭐ 查看我的评价
        </Button>
        <Button
          style={{
            flex: 1,
            height: 88,
            borderRadius: 12,
            background: '#fff',
            color: '#F53F3F',
            fontSize: 28,
            fontWeight: 500,
            boxShadow: '0 4rpx 12rpx rgba(0,0,0,0.06)'
          }}
          onClick={handleGoToReport}
        >
          ⚠️ 发起爽约反馈
        </Button>
      </View>
    </ScrollView>
  );
};

export default CreditPage;
