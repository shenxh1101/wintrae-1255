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
    favoriteContacts
  } = useAppStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    setItemId(params.id as string);
    setType((params.type as 'item' | 'service') || 'item');
    console.log('[Detail] Page params:', params);
  }, []);

  const itemObj = useMemo(() => {
    if (type === 'item') {
      return items.find(i => i.id === itemId) || null;
    }
    return services.find(s => s.id === itemId) || null;
  }, [type, itemId, items, services]);

  const images = useMemo(() => {
    if (!itemObj) return ['https://picsum.photos/id/225/750/500'];
    if (itemObj.images && itemObj.images.length > 0) return itemObj.images;
    return ['https://picsum.photos/id/225/750/500'];
  }, [itemObj]);

  useEffect(() => {
    if (itemObj) {
      const pubId = itemObj.publisherId;
      const isFav = favoriteContacts.some(f => f.contact.id === pubId);
      setIsFavorited(isFav);
    }
  }, [itemObj, favoriteContacts]);

  if (!itemObj) {
    return (
      <ScrollView className={styles.detailPage}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 32, color: '#999' }}>内容不存在或已下架</Text>
        </View>
      </ScrollView>
    );
  }

  const publisher = itemObj.publisher;
  const publisherId = itemObj.publisherId;
  const isOwner = publisherId === currentUser.id;

  const getTypeTag = () => {
    if (type === 'item') {
      const itemType = (itemObj as any).type;
      if (itemType === 'needed') {
        return { className: styles.needTag, text: '求购/求借' };
      }
      return { className: styles.exchangeTag, text: '可交换' };
    }
    return { className: styles.serviceTag, text: '代办服务' };
  };

  const typeTag = getTypeTag();

  const handleBook = async () => {
    if (isOwner) {
      showToast('不能预约自己发布的内容');
      return;
    }

    if (type === 'item' && !selectedTimeSlot) {
      showToast('请选择交换时间段');
      return;
    }

    const confirmed = await showModal(
      '确认预约',
      selectedTimeSlot
        ? `确认预约「${itemObj.title}」时间段 ${selectedTimeSlot} 吗？`
        : `确认预约「${itemObj.title}」吗？`
    );

    if (!confirmed) return;

    try {
      const bookingId = addBooking({
        itemId: type === 'item' ? itemObj.id : undefined,
        item: type === 'item' ? itemObj as any : undefined,
        serviceId: type === 'service' ? itemObj.id : undefined,
        service: type === 'service' ? itemObj as any : undefined,
        publisherId,
        publisher,
        responderId: currentUser.id,
        responder: currentUser,
        appointmentTime: selectedTimeSlot || new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace('T', ' '),
        status: 'pending',
        needBothConfirm: itemObj.needBothConfirm,
        type
      });

      console.log('[Detail] Booking created:', bookingId);
      showToast('预约成功', 'success');

      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/publish-success/index?type=booking&id=${bookingId}`
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

    const defaultTime = new Date(Date.now() + 3600000);
    const timeStr = defaultTime.toISOString().slice(0, 16).replace('T', ' ');

    const confirmed = await showModal(
      '确认接单',
      `确认接受「${itemObj.title}」吗？\n预计上门时间：${timeStr}`
    );

    if (!confirmed) return;

    try {
      const bookingId = addBooking({
        serviceId: itemObj.id,
        service: itemObj as any,
        publisherId,
        publisher,
        responderId: currentUser.id,
        responder: currentUser,
        appointmentTime: timeStr,
        status: 'confirmed',
        needBothConfirm: itemObj.needBothConfirm,
        type: 'service'
      });

      console.log('[Detail] Service accepted:', bookingId);
      showToast('接单成功', 'success');

      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/publish-success/index?type=accept&id=${bookingId}`
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
  };

  const handleContact = () => {
    showToast('聊天功能开发中');
  };

  const needsDualConfirmation = itemObj.isValuable || itemObj.needBothConfirm;

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
              <Text className={styles.title}>{itemObj.title}</Text>
              <View>
                <Text className={styles.categoryTag}>
                  {itemObj.category}
                </Text>
                {type === 'item' && (
                  <Text className={styles.categoryTag}>
                    {getDeliveryTypeText((itemObj as any).deliveryType)}
                  </Text>
                )}
                {type === 'service' && (itemObj as any).estimatedTime && (
                  <Text className={styles.categoryTag}>
                    约{(itemObj as any).estimatedTime}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className={styles.infoRow}>
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>📍</Text>
              <Text>{itemObj.building} {itemObj.unit}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>📅</Text>
              <Text>{formatDate(itemObj.createdAt)}</Text>
            </View>
          </View>

          <Text className={styles.description}>{itemObj.description}</Text>

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

          {type === 'item' && (itemObj as any).timeSlots && (itemObj as any).timeSlots.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>
                ⏰ 选择交换时间段
              </Text>
              {(itemObj as any).timeSlots.map((slot: string) => (
                <Button
                  key={slot}
                  className={styles.timeSlotItem}
                  onClick={() => setSelectedTimeSlot(slot)}
                  style={{
                    background: selectedTimeSlot === slot
                      ? 'rgba(255, 138, 61, 0.1)'
                      : '#f5f5f5',
                    border: selectedTimeSlot === slot
                      ? '2rpx solid #FF8A3D'
                      : '2rpx solid transparent'
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

          {type === 'service' && (itemObj as any).volunteer && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>
                🤝 志愿者信息
              </Text>
              <View style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f5f5f5', borderRadius: 12 }}>
                <Image
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                  src={(itemObj as any).volunteer.avatar}
                  mode='aspectFill'
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 28, fontWeight: 500 }}>{(itemObj as any).volunteer.name}</Text>
                  <Text style={{ fontSize: 24, color: '#999' }}>
                    上门时间：{(itemObj as any).appointmentTime || '待确认'}
                  </Text>
                </View>
              </View>
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

        {type === 'service' && (itemObj as any).status && (
          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>📋 服务状态</Text>
            <View className={styles.tagsRow}>
              <Text className={styles.tag}>
                状态：{
                  (itemObj as any).status === 'open' ? '待接单' :
                  (itemObj as any).status === 'accepted' ? '已接单' :
                  (itemObj as any).status === 'in_progress' ? '进行中' : '已完成'
                }
              </Text>
              {(itemObj as any).volunteer && (
                <Text className={styles.tag}>志愿者：{(itemObj as any).volunteer.name}</Text>
              )}
              {(itemObj as any).appointmentTime && (
                <Text className={styles.tag}>上门时间：{(itemObj as any).appointmentTime}</Text>
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
          <Button
            className={styles.primaryBtn}
            onClick={handleAcceptService}
            disabled={(itemObj as any).status !== 'open'}
          >
            {(itemObj as any).status !== 'open' ? '已被接单' : '立即接单'}
          </Button>
        ) : (
          <Button
            className={styles.primaryBtn}
            onClick={handleBook}
            disabled={isOwner || (type === 'item' && (itemObj as any).status !== 'available')}
          >
            {isOwner ? '您的发布' : type === 'item' && (itemObj as any).status !== 'available' ? '已被预约' : '立即预约'}
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default DetailPage;
