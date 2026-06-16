import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import RatingStars from '@/components/RatingStars';
import { formatDate, getDeliveryTypeText, showToast, showModal } from '@/utils';
import styles from './index.module.scss';

const DetailPage: React.FC = () => {
  const [itemId, setItemId] = useState<string | null>(null);
  const [type, setType] = useState<'item' | 'service'>('item');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const {
    items,
    services,
    currentUser,
    addBooking,
    updateBooking,
    favoriteContacts
  } = useAppStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    setItemId(params.id as string);
    setType((params.type as 'item' | 'service') || 'item');
    console.log('[Detail] Page params:', params);
  }, []);

  const item = useMemo(() => {
    if (type === 'item') {
      return items.find(i => i.id === itemId);
    }
    return services.find(s => s.id === itemId);
  }, [type, itemId, items, services]);

  const images = useMemo(() => {
    if (!item) return ['https://via.placeholder.com/750x500?text=暂无图片'];
    if ('images' in item && item.images.length > 0) return item.images;
    return ['https://via.placeholder.com/750x500?text=暂无图片'];
  }, [item]);

  useEffect(() => {
    if (item) {
      const publisherId = 'publisherId' in item ? item.publisherId : item.requesterId;
      const isFav = favoriteContacts.some(f => f.contact.id === publisherId);
      setIsFavorited(isFav);
    }
  }, [item, favoriteContacts]);

  if (!item) {
    return (
      <ScrollView className={styles.detailPage}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 32, color: '#999' }}>加载中...</Text>
        </View>
      </ScrollView>
    );
  }

  const publisher = 'publisher' in item ? item.publisher : ('requester' in item ? item.requester : item.volunteer);
  const publisherId = 'publisherId' in item ? item.publisherId : item.requesterId;
  const isOwner = publisherId === currentUser.id;

  const getTypeTag = () => {
    if (type === 'item') {
      return 'type' in item && item.type === 'need'
        ? { className: styles.needTag, text: '求购需求' }
        : { className: styles.exchangeTag, text: '可交换' };
    }
    return { className: styles.serviceTag, text: '代办服务' };
  };

  const typeTag = getTypeTag();

  const handleBook = async () => {
    if (isOwner) {
      showToast('不能预约自己发布的内容');
      return;
    }

    if (!selectedTimeSlot && 'timeSlots' in item) {
      showToast('请选择交换时间段');
      return;
    }

    const confirmed = await showModal(
      '确认预约',
      selectedTimeSlot
        ? `确认预约 ${selectedTimeSlot} 吗？`
        : '确认预约该服务吗？'
    );

    if (!confirmed) return;

    try {
      const booking = addBooking({
        itemId: item.id,
        itemType: type,
        title: item.title,
        publisherId,
        publisher,
        responderId: currentUser.id,
        responder: currentUser,
        status: 'pending',
        scheduledTime: selectedTimeSlot || undefined,
        location: 'location' in item ? item.location : item.building + item.unit,
        notes: ''
      });

      console.log('[Detail] Booking created:', booking);
      showToast('预约成功', 'success');

      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/publish-success/index?type=booking&id=${booking.id}`
        });
      }, 1500);
    } catch (error) {
      console.error('[Detail] Booking error:', error);
      showToast('预约失败', 'error');
    }
  };

  const handleAcceptService = async () => {
    if (isOwner) {
      showToast('不能接自己发布的订单');
      return;
    }

    if (!currentUser.isVolunteer) {
      showToast('仅志愿者可以接单');
      return;
    }

    const confirmed = await showModal(
      '确认接单',
      '确认接受该服务请求吗？接单后请及时联系用户确认上门时间。'
    );

    if (!confirmed) return;

    try {
      const booking = addBooking({
        itemId: item.id,
        itemType: type,
        title: item.title,
        publisherId,
        publisher,
        responderId: currentUser.id,
        responder: currentUser,
        status: 'accepted',
        scheduledTime: new Date(Date.now() + 3600000).toISOString(),
        location: 'location' in item ? item.location : item.building + item.unit,
        notes: ''
      });

      console.log('[Detail] Service accepted:', booking);
      showToast('接单成功', 'success');

      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/publish-success/index?type=accept&id=${booking.id}`
        });
      }, 1500);
    } catch (error) {
      console.error('[Detail] Accept error:', error);
      showToast('接单失败', 'error');
    }
  };

  const toggleFavorite = () => {
    if (isOwner) {
      showToast('不能收藏自己');
      return;
    }

    setIsFavorited(!isFavorited);
    showToast(isFavorited ? '已取消收藏' : '已收藏联系人', 'success');
    console.log('[Detail] Toggle favorite:', publisherId);
  };

  const handleContact = () => {
    showToast('聊天功能开发中');
    console.log('[Detail] Contact user:', publisherId);
  };

  const needsDualConfirmation = 'dualConfirmation' in item && item.dualConfirmation;

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.imageGallery}>
        <Image
          className={styles.mainImage}
          src={images[currentImageIndex]}
          mode='aspectFill'
          onError={(e) => console.error('[Detail] Image error:', e)}
        />
        {images.length > 1 && (
          <Text className={styles.imageIndicator}>
            {currentImageIndex + 1} / {images.length}
          </Text>
        )}
      </View>

      <View className={styles.contentSection}>
        <View className={styles.mainCard}>
          <View className={styles.headerRow}>
            <View className={`${styles.typeTag} ${typeTag.className}`}>
              {typeTag.text}
            </View>
            <View className={styles.titleSection}>
              <Text className={styles.title}>{item.title}</Text>
              <View>
                <Text className={styles.categoryTag}>
                  {item.category}
                </Text>
                {type === 'item' && 'deliveryType' in item && (
                  <Text className={styles.categoryTag}>
                    {getDeliveryTypeText(item.deliveryType)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className={styles.infoRow}>
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>📍</Text>
              <Text>{item.building} {item.unit}</Text>
            </View>
            {type === 'item' && 'estimatedTime' in item && (
              <View className={styles.infoItem}>
                <Text className={styles.infoIcon}>⏱️</Text>
                <Text>{item.estimatedTime}</Text>
              </View>
            )}
            {type === 'service' && 'estimatedTime' in item && (
              <View className={styles.infoItem}>
                <Text className={styles.infoIcon}>⏱️</Text>
                <Text>约{item.estimatedTime}分钟</Text>
              </View>
            )}
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>📅</Text>
              <Text>{formatDate(item.createdAt)}</Text>
            </View>
          </View>

          <Text className={styles.description}>{item.description}</Text>

          {images.length > 1 && (
            <ScrollView scrollX className={styles.imagesRow} showScrollbar={false}>
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  className={styles.thumbImage}
                  src={img}
                  mode='aspectFill'
                  onClick={() => setCurrentImageIndex(idx)}
                />
              ))}
            </ScrollView>
          )}

          {needsDualConfirmation && (
            <View className={styles.dualConfirmation}>
              <Text className={styles.dualIcon}>🔒</Text>
              <Text className={styles.dualText}>
                此物品为贵重物品，需要双方到场确认物品状态后才能完成交换。
              </Text>
            </View>
          )}

          {'timeSlots' in item && item.timeSlots.length > 0 && (
            <View className={styles.timeSlotList}>
              {item.timeSlots.map((slot) => (
                <Button
                  key={slot}
                  className={styles.timeSlotItem}
                  onClick={() => setSelectedTimeSlot(slot)}
                  style={{
                    background: selectedTimeSlot === slot
                      ? 'rgba(255, 138, 61, 0.1)'
                      : '$color-bg-hover',
                    border: selectedTimeSlot === slot
                      ? '2rpx solid #FF8A3D'
                      : 'none'
                  }}
                >
                  <Text className={styles.timeSlotText}>{slot}</Text>
                  <Text className={`${styles.timeSlotStatus} ${
                    selectedTimeSlot === slot ? styles.confirmed : styles.available
                  }`}>
                    {selectedTimeSlot === slot ? '已选择' : '可预约'}
                  </Text>
                </Button>
              ))}
            </View>
          )}
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>👤 发布者</Text>
          <View className={styles.publisherRow}>
            <Image
              className={styles.publisherAvatar}
              src={publisher.avatar}
              mode='aspectFill'
              onError={(e) => console.error('[Detail] Publisher avatar error:', e)}
            />
            <View className={styles.publisherInfo}>
              <Text className={styles.publisherName}>{publisher.name}</Text>
              <Text className={styles.publisherLocation}>
                📍 {publisher.building} {publisher.unit}
              </Text>
              <View className={styles.ratingRow}>
                <RatingStars rating={Math.round(publisher.rating)} size={28} />
                <Text className={styles.ratingScore}>{publisher.rating.toFixed(1)}</Text>
                <Text style={{ fontSize: 22, color: '#999', marginLeft: 8 }}>
                  ({publisher.exchangeCount}次交换)
                </Text>
              </View>
            </View>
            <Button
              className={`${styles.favoriteBtn} ${isFavorited ? styles.favorited : ''}`}
              onClick={toggleFavorite}
            >
              {isFavorited ? '⭐' : '☆'}
            </Button>
          </View>
        </View>

        {'status' in item && (
          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>📋 服务状态</Text>
            <View className={styles.tagsRow}>
              <Text className={styles.tag}>
                状态：{
                  item.status === 'open' ? '待接单' :
                  item.status === 'accepted' ? '已接单' :
                  item.status === 'in_progress' ? '进行中' : '已完成'
                }
              </Text>
              {'volunteer' in item && item.volunteer && (
                <Text className={styles.tag}>志愿者：{item.volunteer.name}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleContact}>
          联系TA
        </Button>
        {type === 'service' && !isOwner ? (
          <Button className={styles.primaryBtn} onClick={handleAcceptService}>
            立即接单
          </Button>
        ) : (
          <Button
            className={styles.primaryBtn}
            onClick={handleBook}
            disabled={isOwner}
          >
            {isOwner ? '您的发布' : '立即预约'}
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default DetailPage;
