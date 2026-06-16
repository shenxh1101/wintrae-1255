import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { showToast, showModal } from '@/utils';
import styles from './index.module.scss';

const ReportPage: React.FC = () => {
  const [bookingId, setBookingId] = useState<string>('');
  const [mode, setMode] = useState<'select' | 'submit' | 'history'>('select');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);

  const { bookings, currentUser, updateBooking } = useAppStore();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const paramId = params.id as string || '';
    const paramMode = params.mode as string || '';

    if (paramId) {
      setBookingId(paramId);
      setMode('submit');
    }

    if (paramMode === 'history') {
      setMode('history');
    }

    console.log('[Report] Page params:', params);

    const saved = Taro.getStorageSync('reports');
    if (saved) {
      try {
        setSubmittedReports(JSON.parse(saved));
      } catch (e) {
        console.error('[Report] Parse reports error:', e);
      }
    }
  }, []);

  const myBookings = useMemo(() =>
    bookings.filter(b =>
      (b.publisherId === currentUser.id || b.responderId === currentUser.id) &&
      b.status !== 'cancelled'
    ),
    [bookings, currentUser.id]
  );

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

  const reasonOptions = [
    '未按时到达约定地点',
    '未提前告知取消预约',
    '联系方式无法联系',
    '物品/服务与描述不符',
    '态度恶劣或不配合',
    '其他原因'
  ];

  const handleSelectBooking = (id: string) => {
    setBookingId(id);
    setMode('submit');
    console.log('[Report] Selected booking:', id);
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    console.log('[Report] Selected reason:', reason);
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 3) {
      showToast('最多上传3张照片');
      return;
    }

    try {
      const res = await Taro.chooseImage({
        count: 3 - photos.length,
        sizeType: ['compressed']
      });
      setPhotos(prev => [...prev, ...res.tempFilePaths]);
      console.log('[Report] Photos added:', res.tempFilePaths.length);
    } catch (error) {
      console.error('[Report] Choose image error:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      showToast('请选择反馈原因');
      return;
    }

    if (description.length < 10) {
      showToast('请详细描述情况（至少10字）');
      return;
    }

    const confirmed = await showModal(
      '提交反馈',
      '您确定要提交此爽约反馈吗？平台会在24小时内审核处理。恶意举报会影响您的信用。',
      true
    );

    if (!confirmed) return;

    try {
      const report = {
        id: Date.now().toString(),
        bookingId,
        reportedUserId: targetUser?.id,
        reportedUser: targetUser,
        reason: selectedReason,
        description,
        photos,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reporterId: currentUser.id
      };

      const updatedReports = [report, ...submittedReports];
      setSubmittedReports(updatedReports);
      Taro.setStorageSync('reports', JSON.stringify(updatedReports));

      if (booking) {
        updateBooking(booking.id, { hasReport: true });
      }

      console.log('[Report] Submitted:', report);
      showToast('反馈已提交', 'success');

      setTimeout(() => {
        setMode('history');
      }, 1500);
    } catch (error) {
      console.error('[Report] Submit error:', error);
      showToast('提交失败', 'error');
    }
  };

  const handleCancel = () => {
    if (mode === 'submit' && !Taro.getCurrentInstance().router?.params?.id) {
      setMode('select');
      setBookingId('');
      setSelectedReason('');
      setDescription('');
      setPhotos([]);
    } else {
      Taro.navigateBack();
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '审核中';
      case 'approved': return '已处理';
      case 'rejected': return '已驳回';
      default: return '未知';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      default: return '';
    }
  };

  if (mode === 'history') {
    return (
      <ScrollView scrollY className={styles.reportPage}>
        <View className={styles.pageHeader}>
          <Text className={styles.pageTitle}>📋 反馈记录</Text>
          <Text className={styles.pageSubtitle}>查看您提交的所有爽约反馈记录</Text>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            📊 反馈统计
          </Text>
          <View style={{ display: 'flex', justifyContent: 'space-around', padding: '24rpx 0' }}>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#F53F3F' }}>
                {submittedReports.length}
              </Text>
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>总反馈</Text>
            </View>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#F59E0B' }}>
                {submittedReports.filter(r => r.status === 'pending').length}
              </Text>
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>审核中</Text>
            </View>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#16A34A' }}>
                {submittedReports.filter(r => r.status === 'approved').length}
              </Text>
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>已处理</Text>
            </View>
          </View>
        </View>

        <View className={styles.historySection}>
          <Text className={styles.sectionTitle}>
            📝 反馈详情
          </Text>
          <View className={styles.sectionCard}>
            {submittedReports.length === 0 ? (
              <View style={{ padding: 60, textAlign: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                <Text style={{ fontSize: 28, color: '#999' }}>暂无反馈记录</Text>
              </View>
            ) : (
              submittedReports.map((report) => (
                <View key={report.id} className={styles.historyItem}>
                  <View className={styles.historyHeader}>
                    <Text className={styles.historyUser}>
                      被举报人：{report.reportedUser?.name || '匿名用户'}
                    </Text>
                    <Text className={`${styles.historyStatus} ${getStatusClass(report.status)}`}>
                      {getStatusText(report.status)}
                    </Text>
                  </View>
                  <Text className={styles.historyReason}>原因：{report.reason}</Text>
                  {report.description && (
                    <Text className={styles.historyReason}>描述：{report.description}</Text>
                  )}
                  <Text className={styles.historyDate}>
                    {new Date(report.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (mode === 'select') {
    return (
      <ScrollView scrollY className={styles.reportPage}>
        <View className={styles.pageHeader}>
          <Text className={styles.pageTitle}>⚠️ 爽约反馈</Text>
          <Text className={styles.pageSubtitle}>
            请选择您要反馈的预约记录
          </Text>
        </View>

        <View className={styles.warningBox}>
          <Text className={styles.warningTitle}>
            ⚠️ 注意事项
          </Text>
          <Text className={styles.warningText}>
            • 请确保反馈内容真实有效{'\n'}
            • 恶意举报将影响您的信用分{'\n'}
            • 30天内累计3次爽约将被限制发布功能7天
          </Text>
        </View>

        <Text className={styles.sectionTitle} style={{ margin: '0 0 16rpx 0' }}>
          📋 选择预约记录
        </Text>

        {myBookings.length === 0 ? (
          <View className={styles.sectionCard} style={{ textAlign: 'center', padding: 60 }}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={{ fontSize: 28, color: '#999', marginTop: 16, display: 'block' }}>
              暂无可反馈的预约记录
            </Text>
          </View>
        ) : (
          myBookings.map((b) => {
            const otherUser = b.publisherId === currentUser.id ? b.responder : b.publisher;
            const title = b.item?.title || b.service?.title || '未知';
            return (
              <View key={b.id} className={styles.sectionCard} style={{ marginBottom: 16 }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Image
                    style={{ width: 64, height: 64, borderRadius: 32, flexShrink: 0 }}
                    src={otherUser?.avatar || ''}
                    mode='aspectFill'
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 28, fontWeight: 500 }}>{title}</Text>
                    <Text style={{ fontSize: 24, color: '#999', marginTop: 4 }}>
                      {otherUser?.name} · {b.appointmentTime}
                    </Text>
                  </View>
                  <Button
                    style={{
                      padding: '8rpx 24rpx',
                      background: '#FF8A3D',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 24,
                      flexShrink: 0
                    }}
                    onClick={() => handleSelectBooking(b.id)}
                  >
                    选择
                  </Button>
                </View>
              </View>
            );
          })
        )}

        {submittedReports.length > 0 && (
          <Button
            style={{
              width: '100%',
              marginTop: 32,
              background: '#f5f5f5',
              color: '#666',
              borderRadius: 12,
              padding: '24rpx',
              fontSize: 28
            }}
            onClick={() => setMode('history')}
          >
            📋 查看反馈记录 ({submittedReports.length})
          </Button>
        )}
      </ScrollView>
    );
  }

  if (!booking || !targetUser) {
    return (
      <ScrollView scrollY className={styles.reportPage}>
        <View className={styles.pageHeader}>
          <Text className={styles.pageTitle}>⚠️ 爽约反馈</Text>
          <Text className={styles.pageSubtitle}>未找到预约记录</Text>
        </View>
        <View className={styles.sectionCard} style={{ textAlign: 'center', padding: 60 }}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={{ fontSize: 28, color: '#999', marginTop: 16, display: 'block' }}>
            未找到对应的预约记录
          </Text>
          <Button
            style={{ marginTop: 32, background: '#FF8A3D', color: '#fff', borderRadius: 12, padding: '16rpx 48rpx' }}
            onClick={() => { setMode('select'); setBookingId(''); }}
          >
            选择预约记录
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView scrollY className={styles.reportPage}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>⚠️ 爽约反馈</Text>
        <Text className={styles.pageSubtitle}>
          请如实填写反馈内容，平台会在24小时内审核处理。
        </Text>
      </View>

      <View className={styles.warningBox}>
        <Text className={styles.warningTitle}>
          ⚠️ 注意事项
        </Text>
        <Text className={styles.warningText}>
          • 请确保反馈内容真实有效，提供相关证据有助于快速处理{'\n'}
          • 恶意举报、诬告他人将被扣减信用分，情节严重者封禁账号{'\n'}
          • 30天内累计3次爽约将被限制发布功能7天
        </Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          📋 预约信息
        </Text>
        <View className={styles.bookingInfo}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>服务内容</Text>
            <Text className={styles.infoValue}>{booking.item?.title || booking.service?.title || '未知'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预约时间</Text>
            <Text className={styles.infoValue}>{booking.appointmentTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>类型</Text>
            <Text className={styles.infoValue}>{booking.type === 'item' ? '物品交换' : '代办服务'}</Text>
          </View>
        </View>

        <View className={styles.userSection}>
          <Image
            className={styles.userAvatar}
            src={targetUser.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[Report] User avatar error:', e)}
          />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>被举报人：{targetUser.name}</Text>
            <Text className={styles.userDesc}>
              {targetUser.building} · 评分 {targetUser.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          ❓ 反馈原因
        </Text>
        <View className={styles.reasonSection}>
          {reasonOptions.map((reason) => (
            <Button
              key={reason}
              className={`${styles.reasonOption} ${selectedReason === reason ? styles.active : ''}`}
              onClick={() => handleReasonSelect(reason)}
            >
              <View className={`${styles.reasonRadio} ${selectedReason === reason ? styles.active : ''}`}>
                {selectedReason === reason && <View className={styles.reasonCheck} />}
              </View>
              <Text className={styles.reasonText}>{reason}</Text>
            </Button>
          ))}
        </View>

        <Textarea
          className={styles.textarea}
          placeholder='请详细描述情况，包括时间、地点、具体事件等...'
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          maxlength={300}
          autoHeight
        />
        <Text className={styles.charCount}>{description.length}/300</Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          📷 证据照片 (可选)
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
          {photos.length < 3 && (
            <Button
              className={styles.addPhotoBtn}
              onClick={handleAddPhoto}
            >
              +
              <Text className={styles.addPhotoText}>上传证据</Text>
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
          disabled={!selectedReason || description.length < 10}
        >
          提交反馈
        </Button>
      </View>
    </ScrollView>
  );
};

export default ReportPage;
