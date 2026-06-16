import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import { Service } from '@/types';
import { formatDate } from '@/utils';
import RatingStars from '@/components/RatingStars';
import styles from './index.module.scss';

interface ServiceCardProps {
  service: Service;
  onClick?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      open: '待接单',
      accepted: '已接单',
      in_progress: '进行中',
      completed: '已完成'
    };
    return map[status] || status;
  };

  return (
    <View className={styles.serviceCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.imageWrapper}>
          <Image
            className={styles.serviceImage}
            src={service.images[0]}
            mode='aspectFill'
            lazyLoad
            onError={(e) => console.error('[ServiceCard] Image load error:', e)}
          />
        </View>
        <View className={styles.cardContent}>
          <View>
            <Text className={classnames(styles.typeTag, {
              [styles.errand]: service.type === 'errand',
              [styles.helper]: service.type === 'helper'
            })}>
              {service.type === 'errand' ? '跑腿代办' : '志愿服务'}
            </Text>
            <Text className={classnames(styles.statusTag, {
              [styles.open]: service.status === 'open',
              [styles.accepted]: service.status === 'accepted',
              [styles.inProgress]: service.status === 'in_progress',
              [styles.completed]: service.status === 'completed'
            })}>
              {getStatusText(service.status)}
            </Text>
          </View>
          <Text className={styles.serviceTitle}>{service.title}</Text>
          <Text className={styles.serviceDesc}>{service.description}</Text>
        </View>
      </View>

      <View className={styles.tags}>
        <Text className={styles.tag}>
          🏷️ {service.category}
        </Text>
        <Text className={styles.tag}>
          ⏱️ 约{service.estimatedTime}
        </Text>
        {service.needBothConfirm && (
          <Text className={classnames(styles.tag, styles.valuable)}>
            ⚠️ 需双方确认
          </Text>
        )}
      </View>

      {service.volunteer && (
        <View className={styles.volunteerInfo}>
          <Text className={styles.volunteerLabel}>志愿者：</Text>
          <Text className={styles.volunteerName}>{service.volunteer.name}</Text>
        </View>
      )}

      <View className={styles.cardFooter}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={service.publisher.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[ServiceCard] Avatar load error:', e)}
          />
          <View className={styles.userDetails}>
            <Text className={styles.userName}>{service.publisher.name}</Text>
            <Text className={styles.userLocation}>
              {service.building} {service.unit}
            </Text>
          </View>
          <View className={styles.rating}>
            <RatingStars rating={Math.round(service.publisher.rating)} />
          </View>
        </View>
        <Text className={styles.timeInfo}>{formatDate(service.createdAt)}</Text>
      </View>
    </View>
  );
};

export default ServiceCard;
