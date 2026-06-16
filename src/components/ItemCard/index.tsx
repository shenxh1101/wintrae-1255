import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import { Item } from '@/types';
import { getDeliveryTypeText, formatDate } from '@/utils';
import RatingStars from '@/components/RatingStars';
import styles from './index.module.scss';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <View className={styles.itemCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.imageWrapper}>
          <Image
            className={styles.itemImage}
            src={item.images[0]}
            mode='aspectFill'
            lazyLoad
            onError={(e) => console.error('[ItemCard] Image load error:', e)}
          />
        </View>
        <View className={styles.cardContent}>
          <Text className={classnames(styles.typeTag, {
            [styles.exchange]: item.type === 'exchange',
            [styles.needed]: item.type === 'needed'
          })}>
            {item.type === 'exchange' ? '可交换' : '求购/求借'}
          </Text>
          <Text className={styles.itemTitle}>{item.title}</Text>
          <Text className={styles.itemDesc}>{item.description}</Text>
          <View className={styles.tags}>
            <Text className={styles.tag}>
              🏷️ {item.category}
            </Text>
            <Text className={styles.tag}>
              📦 {getDeliveryTypeText(item.deliveryType)}
            </Text>
            {item.needBothConfirm && (
              <Text className={classnames(styles.tag, styles.valuable)}>
                ⚠️ 贵重物品
              </Text>
            )}
          </View>
        </View>
      </View>
      <View className={styles.cardFooter}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={item.publisher.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[ItemCard] Avatar load error:', e)}
          />
          <View className={styles.userDetails}>
            <Text className={styles.userName}>{item.publisher.name}</Text>
            <Text className={styles.userLocation}>
              {item.building} {item.unit}
            </Text>
          </View>
          <View className={styles.rating}>
            <RatingStars rating={Math.round(item.publisher.rating)} />
          </View>
        </View>
        <Text className={styles.timeInfo}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );
};

export default ItemCard;
