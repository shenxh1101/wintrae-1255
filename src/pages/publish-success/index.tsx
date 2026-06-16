import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { getDeliveryTypeText } from '@/utils';
import styles from './index.module.scss';

const PublishSuccessPage: React.FC = () => {
  const [publishType, setPublishType] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');

  const { items, services, bookings } = useAppStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    setPublishType(params.type as string || '');
    setItemId(params.id as string || '');
    console.log('[Success] Page params:', params);
  }, []);

  const publishedItem = useMemo(() => {
    if (!itemId) return null;

    if (publishType === 'exchange' || publishType === 'needed') {
      return { data: items.find(i => i.id === itemId), type: 'item' as const };
    }
    if (publishType === 'service') {
      return { data: services.find(s => s.id === itemId), type: 'service' as const };
    }
    if (publishType === 'booking' || publishType === 'accept') {
      return { data: bookings.find(b => b.id === itemId), type: 'booking' as const };
    }

    const item = items.find(i => i.id === itemId);
    if (item) return { data: item, type: 'item' as const };

    const service = services.find(s => s.id === itemId);
    if (service) return { data: service, type: 'service' as const };

    const booking = bookings.find(b => b.id === itemId);
    if (booking) return { data: booking, type: 'booking' as const };

    return null;
  }, [publishType, itemId, items, services, bookings]);

  const getSuccessInfo = () => {
    switch (publishType) {
      case 'exchange':
        return {
          icon: '🎉',
          title: '发布成功！',
          subtitle: '您的物品已发布到社区广场，等待邻居预约交换',
          tips: [
            '请保持电话畅通，方便邻居联系您',
            '物品交换前请仔细检查物品状态',
            '贵重物品建议开启双方确认功能'
          ]
        };
      case 'needed':
        return {
          icon: '🎯',
          title: '需求发布成功！',
          subtitle: '您的需求已发布到社区广场，有闲置物品的邻居会联系您',
          tips: [
            '请及时查看消息通知，有匹配物品会第一时间提醒',
            '建议设置合理的交换时间段',
            '可以主动浏览广场，寻找心仪物品'
          ]
        };
      case 'service':
        return {
          icon: '📋',
          title: '代办发布成功！',
          subtitle: '您的代办需求已发布，社区志愿者会尽快接单',
          tips: [
            '请保持电话畅通，志愿者接单后会联系您',
            '准备好相关资料和物品，等待志愿者上门',
            '服务完成后记得给志愿者评价打分'
          ]
        };
      case 'booking':
        return {
          icon: '✅',
          title: '预约成功！',
          subtitle: '您的预约请求已发送，请等待发布者确认',
          tips: [
            '请及时查看消息通知，发布者确认后会提醒您',
            '请按时到达约定地点，遵守约定时间',
            '如需取消请提前通知对方'
          ]
        };
      case 'accept':
        return {
          icon: '🤝',
          title: '接单成功！',
          subtitle: '感谢您的热心帮助，请及时联系用户确认上门时间',
          tips: [
            '请尽快联系用户，确认具体上门时间',
            '上门服务请注意个人防护',
            '服务完成后记得让用户确认并评价'
          ]
        };
      default:
        return {
          icon: '✅',
          title: '操作成功！',
          subtitle: '您可以继续浏览其他内容',
          tips: []
        };
    }
  };

  const successInfo = getSuccessInfo();

  const handleViewDetail = () => {
    if (!publishedItem || !itemId) {
      Taro.switchTab({ url: '/pages/square/index' });
      return;
    }

    const type = publishedItem.type === 'booking' ? 'service' : publishedItem.type;
    Taro.redirectTo({
      url: `/pages/detail/index?id=${itemId}&type=${type}`
    });
  };

  const handleBackToSquare = () => {
    Taro.switchTab({ url: '/pages/square/index' });
  };

  const handlePublishAgain = () => {
    Taro.switchTab({ url: '/pages/publish/index' });
  };

  const handleShare = () => {
    console.log('[Success] Share to community');
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const renderInfoRows = () => {
    if (!publishedItem || !publishedItem.data) return null;

    const data = publishedItem.data as any;
    const rows = [];

    if (data.title) {
      rows.push({ label: '标题', value: data.title });
    }

    if (data.category) {
      rows.push({ label: '分类', value: data.category });
    }

    if (data.deliveryType) {
      rows.push({ label: '配送方式', value: getDeliveryTypeText(data.deliveryType) });
    }

    if (data.building && data.unit) {
      rows.push({ label: '位置', value: `${data.building} ${data.unit}` });
    }

    if (data.appointmentTime) {
      rows.push({ label: '预约时间', value: data.appointmentTime });
    }

    if (data.estimatedTime) {
      rows.push({ label: '预计时长', value: data.estimatedTime });
    }

    return rows;
  };

  const infoRows = renderInfoRows();

  return (
    <View className={styles.successPage}>
      <View className={styles.successIcon}>
        {successInfo.icon}
      </View>

      <Text className={styles.successTitle}>
        {successInfo.title}
      </Text>

      <Text className={styles.successSubtitle}>
        {successInfo.subtitle}
      </Text>

      {infoRows && infoRows.length > 0 && (
        <View className={styles.infoCard}>
          {infoRows.map((row, idx) => (
            <View key={idx} className={styles.infoRow}>
              <Text className={styles.infoLabel}>{row.label}</Text>
              <Text className={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}

      {successInfo.tips.length > 0 && (
        <View className={styles.tipSection}>
          <Text className={styles.tipTitle}>
            💡 温馨提示
          </Text>
          {successInfo.tips.map((tip, idx) => (
            <Text key={idx} className={styles.tipText}>
              {'\n'}• {tip}
            </Text>
          ))}
        </View>
      )}

      <View className={styles.buttonGroup}>
        <Button
          className={styles.primaryBtn}
          onClick={handleViewDetail}
        >
          查看详情
        </Button>

        <View className={styles.shareRow}>
          <Button
            className={styles.shareBtn}
            onClick={handlePublishAgain}
          >
            继续发布
          </Button>
          <Button
            className={styles.shareBtn}
            onClick={handleShare}
          >
            分享到社区
          </Button>
        </View>

        <Button
          className={styles.secondaryBtn}
          onClick={handleBackToSquare}
        >
          返回广场
        </Button>
      </View>
    </View>
  );
};

export default PublishSuccessPage;
