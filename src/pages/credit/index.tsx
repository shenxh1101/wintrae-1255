import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import RatingStars from '@/components/RatingStars';
import TabSegment from '@/components/TabSegment';
import { formatDate, showToast } from '@/utils';
import styles from './index.module.scss';

const CreditPage: React.FC = () => {
  const { bookings, currentUser } = useAppStore();
  const [timeRange, setTimeRange] = useState<'month' | 'all'>('all');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receivedReports, setReceivedReports] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [, setRefreshKey] = useState(0);

  const tabs = ['收到的评价', '我发起的反馈', '我收到的反馈'];

  const forceRefresh = () => setRefreshKey(k => k + 1);

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
    try {
      const appealsSaved = Taro.getStorageSync('appeals');
      if (appealsSaved) {
        setAppeals(JSON.parse(appealsSaved));
      }
    } catch (e) {
      console.error('[Credit] Load appeals error:', e);
    }
  }, [currentUser.id]);

  const timeRangeStart = useMemo(() => {
    if (timeRange === 'all') return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }, [timeRange]);

  const isInRange = (dateStr: string) => {
    if (!timeRangeStart) return true;
    return new Date(dateStr) >= timeRangeStart;
  };

  const myCompletedBookings = useMemo(() => {
    return bookings.filter(b =>
      b.status === 'completed' &&
      (b.publisherId === currentUser.id || b.responderId === currentUser.id)
    );
  }, [bookings, currentUser.id]);

  const filteredCompletedBookings = useMemo(() => {
    return myCompletedBookings.filter(b => {
      if (!timeRangeStart || !b.completedAt) return true;
      return new Date(b.completedAt) >= timeRangeStart;
    });
  }, [myCompletedBookings, timeRangeStart]);

  const receivedRatings = useMemo(() => {
    return filteredCompletedBookings
      .filter(b => {
        const rating = b.publisherId === currentUser.id ? b.ratingFromResponder : b.ratingFromPublisher;
        return rating !== undefined;
      })
      .map(b => {
        const isPublisher = b.publisherId === currentUser.id;
        return {
          bookingId: b.id,
          fromUser: isPublisher ? b.responder : b.publisher,
          fromRole: isPublisher ? '响应方' : '发布方',
          rating: isPublisher ? b.ratingFromResponder : b.ratingFromPublisher,
          review: isPublisher ? b.reviewFromResponder : b.reviewFromPublisher,
          tags: b.tags,
          date: b.completedAt || b.createdAt,
          completionPhotos: b.completionPhotos || [],
          booking: b
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredCompletedBookings, currentUser.id]);

  const avgRating = useMemo(() => {
    if (receivedRatings.length === 0) return 0;
    const sum = receivedRatings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / receivedRatings.length) * 10) / 10;
  }, [receivedRatings]);

  const filteredExchangeCount = useMemo(() => {
    return filteredCompletedBookings.length;
  }, [filteredCompletedBookings]);

  const myReportsFiltered = useMemo(() => {
    if (!timeRangeStart) return myReports;
    return myReports.filter(r => isInRange(r.createdAt));
  }, [myReports, timeRangeStart]);

  const receivedReportsFiltered = useMemo(() => {
    if (!timeRangeStart) return receivedReports;
    return receivedReports.filter(r => isInRange(r.createdAt));
  }, [receivedReports, timeRangeStart]);

  const approvedReceivedCount = useMemo(() => {
    return receivedReportsFiltered.filter(r => r.status === 'approved').length;
  }, [receivedReportsFiltered]);

  const creditScore = useMemo(() => {
    const base = 500;
    const ratingBonus = receivedRatings.length > 0 ? Math.round(avgRating * 50) : 0;
    const exchangeBonus = Math.min(filteredExchangeCount * 5, 200);
    const reportDeduction = approvedReceivedCount * 50;
    return Math.max(350, Math.min(950, base + ratingBonus + exchangeBonus - reportDeduction));
  }, [avgRating, filteredExchangeCount, approvedReceivedCount, receivedRatings.length]);

  const creditLevel = useMemo(() => {
    if (creditScore >= 850) return '🌟 极好';
    if (creditScore >= 750) return '⭐ 优秀';
    if (creditScore >= 650) return '👍 良好';
    if (creditScore >= 550) return '😊 一般';
    return '⚠️ 较低';
  }, [creditScore]);

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

  const getCreditImpact = (type: 'rating' | 'report', data: any) => {
    if (type === 'rating') {
      return `+${Math.round((data.rating || 0) * 10)} 分`;
    }
    if (data.status === 'approved') return '-50 分';
    if (data.status === 'pending') return '待定';
    return '无影响';
  };

  const getCreditImpactClass = (impact: string) => {
    if (impact.startsWith('+')) return styles.impactPositive;
    if (impact.startsWith('-')) return styles.impactNegative;
    return styles.impactPending;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleGoToRate = () => {
    Taro.navigateTo({ url: '/pages/ranking/index?mode=view' });
  };

  const handleGoToReport = () => {
    Taro.navigateTo({ url: '/pages/report/index?mode=select' });
  };

  const handleGoToAppealHistory = () => {
    Taro.navigateTo({ url: '/pages/appeal/index?mode=history' });
  };

  const handleGoToAppeal = (report: any) => {
    const paramReportId = report.id ? encodeURIComponent(report.id) : '';
    const paramReportedUser = report.reportedUserId ? encodeURIComponent(report.reportedUserId) : '';
    Taro.navigateTo({
      url: `/pages/appeal/index?reportId=${paramReportId}&reportedUserId=${paramReportedUser}`
    });
  };

  const findReporterName = (reporterId: string, relatedBooking?: any) => {
    if (!relatedBooking) return '邻居用户';
    if (relatedBooking.publisherId === reporterId) return relatedBooking.publisher?.name || '邻居用户';
    if (relatedBooking.responderId === reporterId) return relatedBooking.responder?.name || '邻居用户';
    return '邻居用户';
  };

  const findReporterInfo = (reporterId: string, relatedBooking?: any) => {
    if (!relatedBooking) return null;
    if (relatedBooking.publisherId === reporterId) return relatedBooking.publisher;
    if (relatedBooking.responderId === reporterId) return relatedBooking.responder;
    return null;
  };

  const hasAppeal = (reportId: string) => {
    return appeals.some((a: any) => a.reportId === reportId);
  };

  const getAppealStatus = (reportId: string) => {
    const a = appeals.find((x: any) => x.reportId === reportId);
    return a ? a.status : null;
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

    return receivedRatings.map(r => {
      const isExpanded = expandedId === ('rating_' + r.bookingId);
      return (
        <View key={r.bookingId} className={styles.recordItem}>
          <View className={styles.recordClickable} onClick={() => toggleExpand('rating_' + r.bookingId)}>
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
                    {r.fromUser.building} · {r.fromRole}
                  </Text>
                </View>
              </View>
              <View className={styles.recordRight}>
                <RatingStars rating={r.rating || 0} size={20} />
                <Text className={`${styles.creditImpact} ${getCreditImpactClass(getCreditImpact('rating', r))}`}>
                  {getCreditImpact('rating', r)}
                </Text>
              </View>
            </View>
            {r.review && (
              <Text className={styles.recordContent} numberOfLines={isExpanded ? undefined : 1}>
                "{r.review}"
              </Text>
            )}
            <View className={styles.recordFooter}>
              <Text className={styles.recordTime}>{formatDate(r.date)}</Text>
              <Text className={styles.expandHint}>{isExpanded ? '收起 ▲' : '展开详情 ▼'}</Text>
            </View>
          </View>

          {isExpanded && (
            <View className={styles.expandedDetail}>
              <View className={styles.detailSection}>
                <Text className={styles.detailTitle}>📋 关联预约</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>物品/服务</Text>
                  <Text className={styles.detailValue}>{r.booking.item?.title || r.booking.service?.title || '未知'}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>预约时间</Text>
                  <Text className={styles.detailValue}>{r.booking.appointmentTime}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>完成时间</Text>
                  <Text className={styles.detailValue}>{r.booking.completedAt ? formatDate(r.booking.completedAt) : '未知'}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>类型</Text>
                  <Text className={styles.detailValue}>{r.booking.type === 'item' ? '物品交换' : '代办服务'}</Text>
                </View>
              </View>
              <View className={styles.detailSection}>
                <Text className={styles.detailTitle}>👤 对方信息</Text>
                <View className={styles.detailUserRow}>
                  <Image className={styles.detailAvatar} src={r.fromUser.avatar} mode='aspectFill' />
                  <View className={styles.detailUserInfo}>
                    <Text className={styles.detailUserName}>{r.fromUser.name}</Text>
                    <Text className={styles.detailUserMeta}>{r.fromUser.building} {r.fromUser.unit} · 评分 {r.fromUser.rating.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
              <View className={styles.detailSection}>
                <Text className={styles.detailTitle}>📊 信用影响</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>评价星级</Text>
                  <Text className={styles.detailValue}>{r.rating} 星</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>影响信用分</Text>
                  <Text className={`${styles.detailValue} ${getCreditImpactClass(getCreditImpact('rating', r))}`}>
                    {getCreditImpact('rating', r)}
                  </Text>
                </View>
              </View>
              {r.review && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailTitle}>💬 评价内容</Text>
                  <Text className={styles.detailReview}>{r.review}</Text>
                </View>
              )}
              {r.completionPhotos && r.completionPhotos.length > 0 && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailTitle}>📷 评价照片</Text>
                  <View className={styles.detailPhotos}>
                    {r.completionPhotos.map((p, i) => (
                      <Image key={i} className={styles.detailPhotoImg} src={p} mode='aspectFill' />
                    ))}
                  </View>
                </View>
              )}
              {r.tags && r.tags.length > 0 && (
                <View className={styles.detailTags}>
                  {r.tags.map(tag => (
                    <Text key={tag} className={styles.detailTag}>{tag}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      );
    });
  };

  const renderReportItem = (r: any, type: 'my' | 'received') => {
    const expandKey = type + '_' + r.id;
    const isExpanded = expandedId === expandKey;
    const relatedBooking = bookings.find(b => b.id === r.bookingId);
    const reporterName = findReporterName(r.reporterId, relatedBooking);
    const reporterInfo = findReporterInfo(r.reporterId, relatedBooking);
    const reportedUser = r.reportedUser ||
      (relatedBooking
        ? relatedBooking.publisherId === r.reportedUserId
          ? relatedBooking.publisher
          : relatedBooking.responder
        : null);

    const impact = getCreditImpact('report', r);
    const appealStatus = getAppealStatus(r.id);
    const canAppeal = type === 'received' && r.status === 'approved' && !hasAppeal(r.id);
    const progressSteps = [
      { key: 'created', label: '反馈提交', done: true, desc: r.createdAt },
      { key: 'review', label: '平台审核', done: r.status !== 'pending' || false, desc: r.status === 'pending' ? '进行中...' : '已完成' },
      { key: 'result', label: '处理结果', done: r.status !== 'pending', desc: r.status === 'approved' ? '扣减信用分 50 分' : r.status === 'rejected' ? '不成立，驳回' : '等待中' },
    ];

    return (
      <View key={r.id} className={styles.reportItem}>
        <View className={styles.recordClickable} onClick={() => toggleExpand(expandKey)}>
          <View className={styles.reportHeader}>
            <Text className={styles.reportUser}>
              {type === 'my'
                ? `被举报：${reportedUser?.name || '匿名'}`
                : `举报人：${reporterName}`
              }
            </Text>
            <View className={styles.reportHeaderRight}>
              <Text className={`${styles.creditImpact} ${getCreditImpactClass(impact)}`}>
                {impact}
              </Text>
              <Text className={`${styles.reportStatus} ${getReportStatusClass(r.status)}`}>
                {getReportStatusText(r.status)}
              </Text>
            </View>
          </View>
          <Text className={styles.reportReason}>原因：{r.reason}</Text>
          <View className={styles.recordFooter}>
            <Text className={styles.recordTime}>{formatDate(r.createdAt)}</Text>
            <Text className={styles.expandHint}>{isExpanded ? '收起 ▲' : '展开详情 ▼'}</Text>
          </View>
        </View>

        {isExpanded && (
          <View className={styles.expandedDetail}>
            <View className={styles.detailSection}>
              <Text className={styles.detailTitle}>📋 关联预约</Text>
              {relatedBooking ? (
                <>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>物品/服务</Text>
                    <Text className={styles.detailValue}>{relatedBooking.item?.title || relatedBooking.service?.title || '未知'}</Text>
                  </View>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>预约时间</Text>
                    <Text className={styles.detailValue}>{relatedBooking.appointmentTime}</Text>
                  </View>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>类型</Text>
                    <Text className={styles.detailValue}>{relatedBooking.type === 'item' ? '物品交换' : '代办服务'}</Text>
                  </View>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>预约状态</Text>
                    <Text className={styles.detailValue}>{relatedBooking.status === 'completed' ? '已完成' : relatedBooking.status === 'confirmed' ? '已确认' : relatedBooking.status === 'pending' ? '待确认' : '已取消'}</Text>
                  </View>
                </>
              ) : (
                <Text className={styles.detailReview}>暂无关联预约信息</Text>
              )}
            </View>

            <View className={styles.detailSection}>
              <Text className={styles.detailTitle}>👥 双方身份</Text>
              <View className={styles.detailParties}>
                <View className={styles.partyCard}>
                  <Text className={styles.partyTag}>举报人</Text>
                  {reporterInfo ? (
                    <View className={styles.detailUserRow}>
                      <Image className={styles.detailAvatar} src={reporterInfo.avatar} mode='aspectFill' />
                      <View className={styles.detailUserInfo}>
                        <Text className={styles.detailUserName}>{reporterInfo.name}</Text>
                        <Text className={styles.detailUserMeta}>{reporterInfo.building} {reporterInfo.unit}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text className={styles.detailReview}>{reporterName}</Text>
                  )}
                </View>
                <View className={styles.partyCard}>
                  <Text className={styles.partyTag}>被举报人</Text>
                  {reportedUser ? (
                    <View className={styles.detailUserRow}>
                      <Image className={styles.detailAvatar} src={reportedUser.avatar} mode='aspectFill' />
                      <View className={styles.detailUserInfo}>
                        <Text className={styles.detailUserName}>{reportedUser.name}</Text>
                        <Text className={styles.detailUserMeta}>{reportedUser.building} {reportedUser.unit}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text className={styles.detailReview}>{reportedUser?.name || '匿名'}</Text>
                  )}
                </View>
              </View>
            </View>

            <View className={styles.detailSection}>
              <Text className={styles.detailTitle}>📊 处理进度</Text>
              <View className={styles.progressTimeline}>
                {progressSteps.map((step, idx) => (
                  <View key={step.key} className={styles.progressStep}>
                    <View className={styles.progressStepHeader}>
                      <View className={`${styles.progressDot} ${step.done ? styles.done : ''}`} />
                      <Text className={styles.progressLabel}>{step.label}</Text>
                      <Text className={styles.progressDesc}>{step.desc}</Text>
                    </View>
                    {idx < progressSteps.length - 1 && (
                      <View className={`${styles.progressLine} ${step.done ? styles.done : ''}`} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.detailSection}>
              <Text className={styles.detailTitle}>� 处理结果</Text>
              <View className={styles.resultCard}>
                <View className={styles.resultRow}>
                  <Text className={styles.resultLabel}>反馈原因</Text>
                  <Text className={styles.resultValue}>{r.reason}</Text>
                </View>
                {r.description && (
                  <View className={styles.resultRow}>
                    <Text className={styles.resultLabel}>详细说明</Text>
                    <Text className={styles.resultValue}>{r.description}</Text>
                  </View>
                )}
                <View className={styles.resultRow}>
                  <Text className={styles.resultLabel}>信用变化</Text>
                  <Text className={`${styles.resultValue} ${getCreditImpactClass(impact)}`}>
                    {impact}
                  </Text>
                </View>
                <View className={styles.resultRow}>
                  <Text className={styles.resultLabel}>处理状态</Text>
                  <Text className={`${styles.reportStatus} ${getReportStatusClass(r.status)}`}>
                    {getReportStatusText(r.status)}
                  </Text>
                </View>
              </View>
            </View>

            {appealStatus && (
              <View className={styles.detailSection}>
                <Text className={styles.detailTitle}>⚖️ 申诉状态</Text>
                <View className={styles.appealCard}>
                  <Text className={`${styles.reportStatus} ${
                    appealStatus === 'pending' ? styles.statusPending :
                    appealStatus === 'approved' ? styles.statusApproved :
                    appealStatus === 'rejected' ? styles.statusRejected : ''
                  }`}>
                    {appealStatus === 'pending' ? '申诉审核中' :
                     appealStatus === 'approved' ? '申诉成功，已恢复信用分' :
                     appealStatus === 'rejected' ? '申诉被驳回' : '处理中'}
                  </Text>
                </View>
              </View>
            )}

            {canAppeal && (
              <View className={styles.detailSection}>
                <Button
                  className={styles.appealBtn}
                  onClick={() => handleGoToAppeal(r)}
                >
                  ⚖️ 对此结果发起信用申诉
                </Button>
                <Text className={styles.appealHint}>申诉期：处理结果公示后 7 天内有效</Text>
              </View>
            )}

            {r.photos && r.photos.length > 0 && (
              <View className={styles.detailSection}>
                <Text className={styles.detailTitle}>� 证据照片</Text>
                <View className={styles.detailPhotos}>
                  {r.photos.map((p, i) => (
                    <Image key={i} className={styles.detailPhotoImg} src={p} mode='aspectFill' />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
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
    return myReportsFiltered.map(r => renderReportItem(r, 'my'));
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
    return receivedReportsFiltered.map(r => renderReportItem(r, 'received'));
  };

  return (
    <ScrollView scrollY className={styles.creditPage}>
      <View className={styles.header}>
        <Text className={styles.creditScore}>{creditScore}</Text>
        <Text className={styles.creditLabel}>信用分{timeRange === 'month' ? '（近一月）' : ''}</Text>
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
          <Text className={styles.statNumber}>{receivedRatings.length > 0 ? avgRating.toFixed(1) : '-'}</Text>
          <Text className={styles.statLabel}>平均评分</Text>
        </View>
      </View>

      <View className={styles.timeFilter}>
        <Button
          className={`${styles.timeBtn} ${timeRange === 'month' ? styles.active : ''}`}
          onClick={() => { setTimeRange('month'); setExpandedId(null); }}
        >
          最近一个月
        </Button>
        <Button
          className={`${styles.timeBtn} ${timeRange === 'all' ? styles.active : ''}`}
          onClick={() => { setTimeRange('all'); setExpandedId(null); }}
        >
          全部时间
        </Button>
      </View>

      <View style={{ padding: '0 32rpx' }}>
        <TabSegment
          tabs={tabs}
          activeIndex={activeTab}
          onChange={(i) => { setActiveTab(i); setExpandedId(null); forceRefresh(); }}
        />
      </View>

      <View className={styles.sectionCard}>
        {activeTab === 0 && renderRatings()}
        {activeTab === 1 && renderMyReports()}
        {activeTab === 2 && renderReceivedReports()}
      </View>

      <View style={{ padding: '0 32rpx', display: 'flex', gap: 24, marginTop: 16, flexDirection: 'column' }}>
        <View style={{ display: 'flex', gap: 24 }}>
          <Button
            style={{
              flex: 1, height: 88, borderRadius: 12,
              background: '#FF8A3D', color: '#fff',
              fontSize: 28, fontWeight: 500
            }}
            onClick={handleGoToRate}
          >
            ⭐ 查看我的评价
          </Button>
          <Button
            style={{
              flex: 1, height: 88, borderRadius: 12,
              background: '#fff', color: '#F53F3F',
              fontSize: 28, fontWeight: 500,
              boxShadow: '0 4rpx 12rpx rgba(0,0,0,0.06)'
            }}
            onClick={handleGoToReport}
          >
            ⚠️ 发起爽约反馈
          </Button>
        </View>
        <Button
          style={{
            width: '100%', height: 88, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontSize: 28, fontWeight: 500
          }}
          onClick={handleGoToAppealHistory}
        >
          ⚖️ 查看申诉记录
        </Button>
      </View>
    </ScrollView>
  );
};

export default CreditPage;
