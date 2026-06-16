import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { showToast, showModal, formatDate } from '@/utils';
import styles from './index.module.scss';

const APPEAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

const APPEAL_STATUS_TEXT: Record<string, string> = {
  [APPEAL_STATUS.PENDING]: '审核中',
  [APPEAL_STATUS.APPROVED]: '申诉成功',
  [APPEAL_STATUS.REJECTED]: '申诉被驳回'
};

const APPEAL_STATUS_CLASS: Record<string, string> = {
  [APPEAL_STATUS.PENDING]: styles.statusPending,
  [APPEAL_STATUS.APPROVED]: styles.statusApproved,
  [APPEAL_STATUS.REJECTED]: styles.statusRejected
};

const APPEAL_REASONS = [
  '本人并非爽约，有证据证明',
  '情况存在误会，已与对方沟通',
  '实际情况与反馈描述不符',
  '不可抗力因素导致',
  '其他原因'
];

const AppealPage: React.FC = () => {
  const { bookings, currentUser, addMessage } = useAppStore();

  const [reportId, setReportId] = useState<string>('');
  const [reportedUserId, setReportedUserId] = useState<string>('');
  const [targetReport, setTargetReport] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submittedAppeals, setSubmittedAppeals] = useState<any[]>([]);
  const [mode, setMode] = useState<'submit' | 'history'>('submit');
  const [relatedBooking, setRelatedBooking] = useState<any>(null);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const rid = (params.reportId as string) ? decodeURIComponent(params.reportId as string) : '';
    const ruid = (params.reportedUserId as string) ? decodeURIComponent(params.reportedUserId as string) : '';
    const m = (params.mode as string) || 'submit';

    console.log('[Appeal] params:', params, { rid, ruid, m });

    if (rid) {
      setReportId(rid);
      setReportedUserId(ruid);
      setMode('submit');
    } else if (m === 'history') {
      setMode('history');
    }

    try {
      const savedAppeals = Taro.getStorageSync('appeals');
      if (savedAppeals) {
        setSubmittedAppeals(JSON.parse(savedAppeals));
      }
    } catch (e) {
      console.error('[Appeal] Load appeals error:', e);
    }

    try {
      const savedReports = Taro.getStorageSync('reports');
      if (savedReports) {
        const allReports = JSON.parse(savedReports);
        if (rid) {
          const found = allReports.find((r: any) => r.id === rid);
          if (found) {
            setTargetReport(found);
          }
        }
      }
    } catch (e) {
      console.error('[Appeal] Load reports error:', e);
    }
  }, []);

  useEffect(() => {
    if (targetReport && targetReport.bookingId) {
      const found = bookings.find((b) => b.id === targetReport.bookingId);
      setRelatedBooking(found || null);
    }
  }, [targetReport, bookings]);

  const myAppeals = useMemo(() => {
    return submittedAppeals.filter((a) => a.applicantId === currentUser.id);
  }, [submittedAppeals, currentUser.id]);

  const hasAppealed = useMemo(() => {
    return myAppeals.some((a) => a.reportId === reportId);
  }, [myAppeals, reportId]);

  const handleReasonSelect = (reason: string) => {
    if (mode !== 'submit') return;
    setSelectedReason(reason);
  };

  const handleAddPhoto = async () => {
    if (mode !== 'submit') return;
    if (photos.length >= 4) {
      showToast('最多上传4张照片');
      return;
    }

    try {
      const res = await Taro.chooseImage({
        count: 4 - photos.length,
        sizeType: ['compressed']
      });
      setPhotos((prev) => [...prev, ...res.tempFilePaths]);
    } catch (error) {
      console.error('[Appeal] Choose image error:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (mode !== 'submit') return;
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      showToast('请选择申诉理由');
      return;
    }
    if (description.length < 15) {
      showToast('请详细描述申诉理由（至少15字）');
      return;
    }

    const confirmed = await showModal(
      '提交申诉',
      '确认提交此申诉吗？平台会在24小时内重新审核。',
      true
    );

    if (!confirmed) return;

    try {
      const appeal = {
        id: 'a' + Date.now().toString(36),
        reportId,
        reportedUserId: targetReport?.reportedUserId || reportedUserId || '',
        reason: selectedReason,
        description,
        photos,
        status: APPEAL_STATUS.PENDING,
        applicantId: currentUser.id,
        applicant: currentUser,
        createdAt: new Date().toISOString(),
        handledAt: null,
        handleNote: null
      };

      const updated = [appeal, ...submittedAppeals];
      setSubmittedAppeals(updated);
      Taro.setStorageSync('appeals', JSON.stringify(updated));

      addMessage({
        type: 'credit',
        title: '申诉已提交',
        content: `您针对「${selectedReason}」的信用申诉已提交，平台会在24小时内审核。`,
        relatedId: appeal.id,
        senderId: currentUser.id,
        sender: currentUser,
        receiverId: currentUser.id,
        receiver: currentUser
      });

      showToast('申诉已提交', 'success');
      setTimeout(() => {
        setMode('history');
      }, 1500);
    } catch (error) {
      console.error('[Appeal] Submit error:', error);
      showToast('提交失败', 'error');
    }
  };

  const handleCancel = () => {
    if (mode === 'submit' && !Taro.getCurrentInstance().router?.params?.reportId) {
      setMode('history');
      setSelectedReason('');
      setDescription('');
      setPhotos([]);
    } else {
      Taro.navigateBack();
    }
  };

  if (mode === 'history') {
    return (
      <ScrollView scrollY className={styles.appealPage}>
        <View className={styles.pageHeader}>
          <Text className={styles.pageTitle}>⚖️ 信用申诉记录</Text>
          <Text className={styles.pageSubtitle}>查看所有信用申诉的处理进度</Text>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📊 申诉统计</Text>
          <View style={{ display: 'flex', justifyContent: 'space-around', padding: '24rpx 0' }}>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#6366f1' }}>{myAppeals.length}</Text>
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>总申诉</Text>
            </View>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#F59E0B' }}>
                {myAppeals.filter((a) => a.status === APPEAL_STATUS.PENDING).length}
              </Text>
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>审核中</Text>
            </View>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#16A34A' }}>
                {myAppeals.filter((a) => a.status === APPEAL_STATUS.APPROVED).length}
              </Text>
              <Text style={{ fontSize: 24, color: '#999', marginTop: 8 }}>已通过</Text>
            </View>
          </View>
        </View>

        <View className={styles.historySection}>
          <Text className={styles.sectionTitle} style={{ marginLeft: 32, marginRight: 32 }}>
            📋 申诉详情
          </Text>
          <View className={styles.sectionCard}>
            {myAppeals.length === 0 ? (
              <View style={{ padding: 60, textAlign: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>⚖️</Text>
                <Text style={{ fontSize: 28, color: '#999' }}>暂无申诉记录</Text>
              </View>
            ) : (
              myAppeals.map((a) => (
                <View key={a.id} className={styles.historyItem}>
                  <View className={styles.historyHeader}>
                    <Text className={styles.historyReason}>申诉理由：{a.reason}</Text>
                    <Text className={`${styles.historyStatus} ${APPEAL_STATUS_CLASS[a.status] || ''}`}>
                      {APPEAL_STATUS_TEXT[a.status] || '未知'}
                    </Text>
                  </View>
                  {a.description && (
                    <Text className={styles.historyReason}>说明：{a.description}</Text>
                  )}
                  <Text className={styles.historyDate}>{formatDate(a.createdAt)}</Text>
                  {a.photos && a.photos.length > 0 && (
                    <View style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {a.photos.map((p: string, i: number) => (
                        <Image key={i} style={{ width: 120, height: 120, borderRadius: 8 }} src={p} mode='aspectFill' />
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ padding: '0 32rpx 32rpx 32rpx' }}>
          <Button
            style={{
              width: '100%', height: 88, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff', fontSize: 28, fontWeight: 500
            }}
            onClick={() => Taro.navigateTo({ url: '/pages/credit/index' })}
          >
            💳 返回信用记录
          </Button>
        </View>
      </ScrollView>
    );
  }

  if (hasAppealed) {
    const exist = myAppeals.find((a) => a.reportId === reportId);
    return (
      <ScrollView scrollY className={styles.appealPage}>
        <View className={styles.pageHeader}>
          <Text className={styles.pageTitle}>⚖️ 信用申诉</Text>
          <Text className={styles.pageSubtitle}>该反馈已提起过申诉</Text>
        </View>
        <View className={styles.sectionCard} style={{ textAlign: 'center', padding: 60 }}>
          <Text style={{ fontSize: 48 }}>📝</Text>
          <Text style={{ fontSize: 28, color: '#999', marginTop: 16, display: 'block' }}>
            该反馈您已提起申诉
          </Text>
          {exist && (
            <View style={{ marginTop: 24, textAlign: 'left' }}>
              <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, color: '#999' }}>申诉理由</Text>
                <Text style={{ fontSize: 24, color: '#333' }}>{exist.reason}</Text>
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 24, color: '#999' }}>申诉状态</Text>
                <Text className={`${styles.historyStatus} ${APPEAL_STATUS_CLASS[exist.status] || ''}`}>
                  {APPEAL_STATUS_TEXT[exist.status] || '未知'}
                </Text>
              </View>
            </View>
          )}
          <Button
            style={{ marginTop: 32, background: '#6366f1', color: '#fff', borderRadius: 12, padding: '16rpx 48rpx' }}
            onClick={() => setMode('history')}
          >
            查看全部申诉记录
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView scrollY className={styles.appealPage}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>⚖️ 信用申诉</Text>
        <Text className={styles.pageSubtitle}>对爽约反馈处理结果存在异议，可提交申诉</Text>
      </View>

      <View className={styles.warningBox}>
        <Text className={styles.warningTitle}>⚠️ 申诉说明</Text>
        <Text className={styles.warningText}>
          • 请在处理结果公示后7天内发起申诉{'\n'}
          • 提供真实证据将大大提高申诉通过率{'\n'}
          • 恶意申诉将扣减额外信用分并封禁申诉权限7天
        </Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📋 原始反馈信息</Text>
        {targetReport ? (
          <View className={styles.reportInfo}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>反馈原因</Text>
              <Text className={styles.infoValue}>{targetReport.reason || '-'}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>处理结果</Text>
              <Text className={styles.infoValue} style={{ color: '#F53F3F', fontWeight: 600 }}>
                扣减信用分 50 分
              </Text>
            </View>
            {relatedBooking && (
              <>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>预约内容</Text>
                  <Text className={styles.infoValue}>
                    {relatedBooking.item?.title || relatedBooking.service?.title || '未知'}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>预约时间</Text>
                  <Text className={styles.infoValue}>{relatedBooking.appointmentTime}</Text>
                </View>
              </>
            )}
            {targetReport.createdAt && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>反馈时间</Text>
                <Text className={styles.infoValue}>{formatDate(targetReport.createdAt)}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ padding: 40, textAlign: 'center' }}>
            <Text style={{ fontSize: 28, color: '#999' }}>未找到关联反馈信息</Text>
          </View>
        )}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>❓ 申诉理由</Text>
        <View className={styles.reasonSection}>
          {APPEAL_REASONS.map((reason) => (
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
          placeholder='请详细说明申诉理由，包括时间、地点、具体事件、提供的证据等（至少15字）...'
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <Text className={styles.charCount}>{description.length}/500</Text>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📷 证据照片 (可选，最多4张)</Text>
        <View className={styles.photoSection}>
          {photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image className={styles.photoImg} src={photo} mode='aspectFill' />
              <Button
                className={styles.removeBtn}
                onClick={() => handleRemovePhoto(index)}
              >
                ×
              </Button>
            </View>
          ))}
          {photos.length < 4 && (
            <Button className={styles.addPhotoBtn} onClick={handleAddPhoto}>
              +
              <Text className={styles.addPhotoText}>上传证据</Text>
            </Button>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </Button>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!selectedReason || description.length < 15}
        >
          提交申诉
        </Button>
      </View>
    </ScrollView>
  );
};

export default AppealPage;
