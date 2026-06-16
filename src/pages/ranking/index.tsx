import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import RatingStars from '@/components/RatingStars';
import { showToast, showModal } from '@/utils';
import styles from './index.module.scss';

const RatingPage: React.FC = () => {
  const [bookingId, setBookingId] = useState<string>('');
  const [mode, setMode] = useState<'submit' | 'view'>('submit');
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [ratingText, setRatingText] = useState('');

  const { bookings, completeBooking, currentUser } = useAppStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    setBookingId(params.id as string || '');
    setMode((params.mode as 'submit' | 'view') || 'submit');
    console.log('[Rating] Page params:', params);
  }, []);

  const booking = useMemo(() =>
    bookings.find(b => b.id === bookingId),
    [bookings, bookingId]
  );

  const targetUser = useMemo(() => {
    if (!booking) return null;
    if (booking.publisherId === currentUser.id) {
      return booking.responder;
    }
    return booking.publisher;
  }, [booking, currentUser.id]);

  const ratingTags = [
    '服务准时', '态度很好', '物品完好',
    '沟通顺畅', '值得信赖', '非常专业'
  ];

  const ratingTexts = ['', '很差', '较差', '一般', '满意', '非常满意'];

  useEffect(() => {
    setRatingText(ratingTexts[rating] || '');
  }, [rating]);

  const handleStarClick = (star: number) => {
    if (mode === 'view') return;
    setRating(star);
    console.log('[Rating] Selected rating:', star);
  };

  const toggleTag = (tag: string) => {
    if (mode === 'view') return;
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddPhoto = async () => {
    if (mode === 'view') return;
    if (photos.length >= 4) {
      showToast('最多上传4张照片');
      return;
    }

    try {
      const res = await Taro.chooseImage({
        count: 4 - photos.length,
        sizeType: ['compressed']
      });
      setPhotos(prev => [...prev, ...res.tempFilePaths]);
      console.log('[Rating] Photos added:', res.tempFilePaths.length);
    } catch (error) {
      console.error('[Rating] Choose image error:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (mode === 'view') return;
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('请选择评分');
      return;
    }

    const confirmed = await showModal(
      '提交评价',
      '确认提交此评价吗？提交后无法修改。'
    );

    if (!confirmed) return;

    try {
      if (booking) {
        completeBooking(booking.id, {
          rating,
          comment,
          tags: selectedTags,
          photos
        });

        console.log('[Rating] Submitted:', { rating, comment, tags: selectedTags, photos });
        showToast('评价成功', 'success');

        setTimeout(() => {
          Taro.switchTab({ url: '/pages/booking/index' });
        }, 1500);
      }
    } catch (error) {
      console.error('[Rating] Submit error:', error);
      showToast('提交失败', 'error');
    }
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  if (mode === 'view') {
    const myRatings = bookings
      .filter(b =>
        b.rating &&
        (b.publisherId === currentUser.id || b.responderId === currentUser.id)
      )
      .reverse();

    return (
      <ScrollView scrollY className={styles.ratingPage}>
        <View className={styles.pageHeader}>
          <Text className={styles.pageTitle}>⭐ 我的评价</Text>
          <Text className={styles.pageSubtitle}>查看收到的所有评价</Text>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            📊 综合评分
          </Text>
          <View style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24rpx 0' }}>
            <Text style={{ fontSize: 72, fontWeight: 'bold', color: '#FF8A3D' }}>
              {currentUser.rating.toFixed(1)}
            </Text>
            <View>
              <RatingStars rating={Math.round(currentUser.rating)} size={32} />
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>
                基于 {currentUser.exchangeCount} 次交换
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.myRatingsSection}>
          <Text className={styles.sectionTitle}>
            📋 评价详情
          </Text>
          <View className={styles.sectionCard}>
            {myRatings.length === 0 ? (
              <View style={{ padding: 60, textAlign: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>⭐</Text>
                <Text style={{ fontSize: 28, color: '#999' }}>暂无评价记录</Text>
              </View>
            ) : (
              myRatings.map((b) => (
                <View key={b.id} className={styles.ratingItem}>
                  <View className={styles.ratingHeader}>
                    <Text className={styles.ratingFrom}>
                      {(b.publisherId === currentUser.id ? b.responder?.name : b.publisher?.name) || '匿名用户'}
                    </Text>
                    <RatingStars rating={b.rating || 0} size={24} />
                  </View>
                  <Text className={styles.ratingDate}>
                    {b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '近期'}
                  </Text>
                  {b.tags && b.tags.length > 0 && (
                    <View style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                      {b.tags.map(tag => (
                        <Text
                          key={tag}
                          style={{
                            padding: '4rpx 16rpx',
                            background: 'rgba(255, 138, 61, 0.1)',
                            color: '#FF8A3D',
                            borderRadius: 24,
                            fontSize: 22
                          }}
                        >
                          {tag}
                        </Text>
                      ))}
                    </View>
                  )}
                  {b.comment && (
                    <Text className={styles.ratingComment}>{b.comment}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!booking || !targetUser) {
    return (
      <ScrollView className={styles.ratingPage}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 32, color: '#999' }}>加载中...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView scrollY className={styles.ratingPage}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>⭐ 服务评价</Text>
        <Text className={styles.pageSubtitle}>您的评价是我们前进的动力</Text>
      </View>

      <View className={styles.bookingInfo}>
        <Text className={styles.bookingTitle}>📋 服务信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务内容</Text>
          <Text className={styles.infoValue}>{booking.title}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>完成时间</Text>
          <Text className={styles.infoValue}>
            {booking.completedAt ? new Date(booking.completedAt).toLocaleString() : '刚刚'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务地点</Text>
          <Text className={styles.infoValue}>{booking.location}</Text>
        </View>
      </View>

      <View className={styles.userSection}>
        <Image
          className={styles.userAvatar}
          src={targetUser.avatar}
          mode='aspectFill'
          onError={(e) => console.error('[Rating] User avatar error:', e)}
        />
        <View className={styles.userInfo}>
          <Text className={styles.userName}>{targetUser.name}</Text>
          <Text className={styles.userDesc}>
            {targetUser.building} · 评分 {targetUser.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          🌟 服务评分
        </Text>
        <View className={styles.ratingSection}>
          <Text className={styles.ratingTitle}>请点击星星进行评分</Text>
          <View className={styles.bigStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                className={styles.starBtn}
                onClick={() => handleStarClick(star)}
              >
                {star <= rating ? '⭐' : '☆'}
              </Button>
            ))}
          </View>
          <Text className={styles.ratingText}>{ratingText}</Text>
        </View>

        <Text className={styles.sectionTitle} style={{ marginTop: 32 }}>
          🏷️ 评价标签
        </Text>
        <View className={styles.tagsSection}>
          {ratingTags.map((tag) => (
            <Button
              key={tag}
              className={`${styles.tagBtn} ${selectedTags.includes(tag) ? styles.active : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          💬 评价内容
        </Text>
        <Textarea
          className={styles.textarea}
          placeholder='分享您的服务体验，帮助其他邻居更好地了解...'
          value={comment}
          onInput={(e) => setComment(e.detail.value)}
          maxlength={200}
          autoHeight
        />
        <Text className={styles.charCount}>{comment.length}/200</Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          📷 完成照片 (可选)
        </Text>
        <View className={styles.photoSection}>
          {photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image
                className={styles.photoImg}
                src={photo}
                mode='aspectFill'
              />
              <Button
                className={styles.removeBtn}
                onClick={() => handleRemovePhoto(index)}
              >
                ×
              </Button>
            </View>
          ))}
          {photos.length < 4 && (
            <Button
              className={styles.addPhotoBtn}
              onClick={handleAddPhoto}
            >
              +
              <Text className={styles.addPhotoText}>添加照片</Text>
            </Button>
          )}
        </View>
      </View>

      <View style={{ height: 180 }} />

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </Button>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          提交评价
        </Button>
      </View>
    </ScrollView>
  );
};

export default RatingPage;
