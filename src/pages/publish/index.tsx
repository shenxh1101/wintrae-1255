import React, { useState } from 'react';
import { View, Text, Input, Textarea, Button, Switch, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { mockCurrentUser, getItemCategories, getServiceCategories, getTimeSlots } from '@/data/mockUsers';
import TabSegment from '@/components/TabSegment';
import { generateId, getCurrentDateTime, showToast, showModal } from '@/utils';
import { Item, Service, DeliveryType, ItemType, ServiceType } from '@/types';
import styles from './index.module.scss';

const PublishPage: React.FC = () => {
  const { addItem, addService, currentUser } = useAppStore();

  const [publishType, setPublishType] = useState<'item' | 'service'>('item');
  const [itemType, setItemType] = useState<ItemType>('exchange');
  const [serviceType, setServiceType] = useState<ServiceType>('errand');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('both');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [isValuable, setIsValuable] = useState(false);
  const [needBothConfirm, setNeedBothConfirm] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const itemCategories = getItemCategories();
  const serviceCategories = getServiceCategories();
  const timeSlots = getTimeSlots();

  const deliveryOptions = [
    { key: 'pickup', label: '仅自提', icon: '🏠' },
    { key: 'delivery', label: '可送达', icon: '🚚' },
    { key: 'both', label: '都可以', icon: '✅' }
  ];

  const itemTypeOptions = [
    { key: 'exchange', label: '可交换物品', icon: '📦' },
    { key: 'needed', label: '需求物品', icon: '🙏' }
  ];

  const serviceTypeOptions = [
    { key: 'errand', label: '需要代办', icon: '🛒' },
    { key: 'helper', label: '提供服务', icon: '🤝' }
  ];

  const estimatedTimeOptions = ['30分钟', '1小时', '2小时', '3小时', '4小时', '半天', '一天'];

  const handleTimeSlotToggle = (slot: string) => {
    setSelectedTimeSlots(prev =>
      prev.includes(slot)
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
    console.log('[Publish] Time slot toggled:', slot);
  };

  const handleChooseImage = () => {
    if (images.length >= 6) {
      showToast('最多上传6张图片');
      return;
    }
    Taro.chooseImage({
      count: 6 - images.length,
      success: (res) => {
        const newImages = res.tempFilePaths;
        setImages(prev => [...prev, ...newImages]);
        console.log('[Publish] Images selected:', newImages.length);
      },
      fail: (err) => {
        console.error('[Publish] Choose image error:', err);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    console.log('[Publish] Image removed:', index);
  };

  const handleImageError = (e: any) => {
    console.error('[Publish] Image load error:', e);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      showToast('请填写标题');
      return false;
    }
    if (!description.trim()) {
      showToast('请填写描述');
      return false;
    }
    if (!category) {
      showToast('请选择分类');
      return false;
    }
    if (publishType === 'item' && selectedTimeSlots.length === 0) {
      showToast('请选择可交换时间段');
      return false;
    }
    if (publishType === 'service' && !estimatedTime) {
      showToast('请选择预计时长');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const confirmed = await showModal(
      '确认发布',
      `您确定要发布"${title}"吗？`
    );

    if (!confirmed) return;

    try {
      if (publishType === 'item') {
        const newItem: Item = {
          id: generateId(),
          type: itemType,
          title: title.trim(),
          description: description.trim(),
          images: images.length > 0 ? images : ['https://picsum.photos/id/225/300/300'],
          category,
          deliveryType,
          timeSlots: selectedTimeSlots,
          building: currentUser.building,
          unit: currentUser.unit,
          publisherId: currentUser.id,
          publisher: currentUser,
          isValuable,
          needBothConfirm: isValuable || needBothConfirm,
          createdAt: getCurrentDateTime(),
          status: 'available'
        };
        addItem(newItem);
        console.log('[Publish] Item published:', newItem.id);

        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/publish-success/index?type=${itemType}&id=${newItem.id}`
          });
        }, 1000);
      } else {
        const newService: Service = {
          id: generateId(),
          type: serviceType,
          title: title.trim(),
          description: description.trim(),
          images: images.length > 0 ? images : ['https://picsum.photos/id/292/300/300'],
          category,
          estimatedTime,
          building: currentUser.building,
          unit: currentUser.unit,
          publisherId: currentUser.id,
          publisher: currentUser,
          isValuable,
          needBothConfirm: isValuable || needBothConfirm,
          completionPhotos: [],
          createdAt: getCurrentDateTime(),
          status: 'open'
        };
        addService(newService);
        console.log('[Publish] Service published:', newService.id);

        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/publish-success/index?type=service&id=${newService.id}`
          });
        }, 1000);
      }

      showToast('发布成功', 'success');
    } catch (error) {
      console.error('[Publish] Submit error:', error);
      showToast('发布失败，请重试', 'error');
    }
  };

  const handleValuableChange = (checked: boolean) => {
    setIsValuable(checked);
    if (checked) {
      setNeedBothConfirm(true);
    }
    console.log('[Publish] Valuable changed:', checked);
  };

  return (
    <ScrollView scrollY className={styles.publishPage}>
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>✨ 发布新内容</Text>
        <Text className={styles.pageSubtitle}>
          四步完成：填写信息 → 选择时间 → 确认发布 → 等待响应
        </Text>
      </View>

      <View className={styles.stepIndicator}>
        <View className={styles.stepItem}>
          <View className={classnames(styles.stepNumber, styles.stepNumberActive)}>1</View>
          <Text className={classnames(styles.stepText, styles.stepTextActive)}>填写信息</Text>
        </View>
        <View className={classnames(styles.stepLine, styles.stepLineActive)} />
        <View className={styles.stepItem}>
          <View className={classnames(styles.stepNumber, styles.stepNumberActive)}>2</View>
          <Text className={classnames(styles.stepText, styles.stepTextActive)}>选择时间</Text>
        </View>
        <View className={styles.stepLine} />
        <View className={styles.stepItem}>
          <View className={styles.stepNumber}>3</View>
          <Text className={styles.stepText}>确认发布</Text>
        </View>
      </View>

      <View className={styles.typeSelector}>
        <Button
          className={classnames(styles.typeCard, {
            [styles.typeCardActive]: publishType === 'item'
          })}
          onClick={() => {
            setPublishType('item');
            setCategory('');
            console.log('[Publish] Type changed to item');
          }}
        >
          <Text className={styles.typeIcon}>📦</Text>
          <Text className={styles.typeName}>物品交换</Text>
          <Text className={styles.typeDesc}>发布闲置或需求物品</Text>
        </Button>
        <Button
          className={classnames(styles.typeCard, {
            [styles.typeCardActive]: publishType === 'service'
          })}
          onClick={() => {
            setPublishType('service');
            setCategory('');
            console.log('[Publish] Type changed to service');
          }}
        >
          <Text className={styles.typeIcon}>🛠️</Text>
          <Text className={styles.typeName}>上门代办</Text>
          <Text className={styles.typeDesc}>发布或提供代办服务</Text>
        </Button>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          📝 基本信息
        </Text>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>
            {publishType === 'item' ? '物品类型' : '服务类型'}
          </Text>
          <TabSegment
            tabs={publishType === 'item'
              ? itemTypeOptions.map(o => o.label)
              : serviceTypeOptions.map(o => o.label)}
            activeIndex={publishType === 'item'
              ? itemType === 'exchange' ? 0 : 1
              : serviceType === 'errand' ? 0 : 1}
            onChange={(i) => {
              if (publishType === 'item') {
                setItemType(i === 0 ? 'exchange' : 'needed');
              } else {
                setServiceType(i === 0 ? 'errand' : 'helper');
              }
              console.log('[Publish] Sub type changed:', i);
            }}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>
            {publishType === 'item' ? '物品标题' : '服务标题'}
          </Text>
          <Input
            className={styles.formInput}
            type='text'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            placeholder={publishType === 'item' ? '请输入物品名称' : '请输入服务名称'}
            maxlength={50}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>
            详细描述
          </Text>
          <Textarea
            className={styles.formTextarea}
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            placeholder={publishType === 'item'
              ? '请详细描述物品的成色、使用情况、交换意向等'
              : '请详细描述服务需求、注意事项等'}
            maxlength={500}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>
            分类
          </Text>
          <View className={styles.optionGrid}>
            {(publishType === 'item' ? itemCategories : serviceCategories).map((cat) => (
              <Button
                key={cat}
                className={classnames(styles.optionItem, {
                  [styles.optionItemActive]: category === cat
                })}
                onClick={() => {
                  setCategory(cat);
                  console.log('[Publish] Category selected:', cat);
                }}
              >
                {cat}
              </Button>
            ))}
          </View>
        </View>

        {publishType === 'item' && (
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              交付方式
            </Text>
            <View className={styles.optionGrid}>
              {deliveryOptions.map((opt) => (
                <Button
                  key={opt.key}
                  className={classnames(styles.optionItem, {
                    [styles.optionItemActive]: deliveryType === opt.key
                  })}
                  onClick={() => {
                    setDeliveryType(opt.key as DeliveryType);
                    console.log('[Publish] Delivery type:', opt.key);
                  }}
                >
                  {opt.icon} {opt.label}
                </Button>
              ))}
            </View>
          </View>
        )}

        {publishType === 'service' && (
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              预计时长
            </Text>
            <View className={styles.optionGrid}>
              {estimatedTimeOptions.map((time) => (
                <Button
                  key={time}
                  className={classnames(styles.optionItem, {
                    [styles.optionItemActive]: estimatedTime === time
                  })}
                  onClick={() => {
                    setEstimatedTime(time);
                    console.log('[Publish] Estimated time:', time);
                  }}
                >
                  ⏱️ {time}
                </Button>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          ⏰ 时间设置
        </Text>

        {publishType === 'item' && (
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              可交换时间段（可多选）
            </Text>
            <View className={styles.timeSlotGrid}>
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  className={classnames(styles.timeSlotItem, {
                    [styles.timeSlotActive]: selectedTimeSlots.includes(slot)
                  })}
                  onClick={() => handleTimeSlotToggle(slot)}
                >
                  {selectedTimeSlots.includes(slot) ? '✓ ' : ''}{slot}
                </Button>
              ))}
            </View>
          </View>
        )}

        {publishType === 'service' && (
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              可服务时间段（可多选，选填）
            </Text>
            <View className={styles.timeSlotGrid}>
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  className={classnames(styles.timeSlotItem, {
                    [styles.timeSlotActive]: selectedTimeSlots.includes(slot)
                  })}
                  onClick={() => handleTimeSlotToggle(slot)}
                >
                  {selectedTimeSlots.includes(slot) ? '✓ ' : ''}{slot}
                </Button>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          📷 图片上传
        </Text>

        <View className={styles.formGroup}>
          <View className={styles.imageUploader}>
            {images.map((img, index) => (
              <View key={index} className={styles.imageItem}>
                <Image
                  className={styles.uploadedImage}
                  src={img}
                  mode='aspectFill'
                  onError={handleImageError}
                />
                <Text
                  className={styles.removeBtn}
                  onClick={() => handleRemoveImage(index)}
                >
                  ✕
                </Text>
              </View>
            ))}
            {images.length < 6 && (
              <Button
                className={styles.addImageBtn}
                onClick={handleChooseImage}
              >
                +
              </Button>
            )}
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          ⚙️ 其他设置
        </Text>

        <View className={styles.switchRow}>
          <View>
            <Text className={styles.switchLabel}>是否为贵重物品/服务</Text>
            <Text className={styles.switchDesc}>开启后需要双方确认才能完成交易</Text>
          </View>
          <Switch
            checked={isValuable}
            onChange={(e) => handleValuableChange(e.detail.value)}
            color='#FF8A3D'
          />
        </View>

        <View className={styles.switchRow}>
          <View>
            <Text className={styles.switchLabel}>需要双方确认</Text>
            <Text className={styles.switchDesc}>确保交易安全，建议开启</Text>
          </View>
          <Switch
            checked={needBothConfirm}
            onChange={(e) => {
              setNeedBothConfirm(e.detail.value);
              console.log('[Publish] Need both confirm:', e.detail.value);
            }}
            color='#FF8A3D'
            disabled={isValuable}
          />
        </View>
      </View>

      <Button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!title || !description || !category}
      >
        立即发布
      </Button>
    </ScrollView>
  );
};

export default PublishPage;
