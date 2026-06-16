import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { mockCommunity, getItemCategories, getServiceCategories } from '@/data/mockUsers';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import TabSegment from '@/components/TabSegment';
import ItemCard from '@/components/ItemCard';
import ServiceCard from '@/components/ServiceCard';
import EmptyState from '@/components/EmptyState';
import { showToast } from '@/utils';
import styles from './index.module.scss';

const SquarePage: React.FC = () => {
  const {
    items,
    services,
    selectedBuilding,
    searchKeyword,
    sortBy,
    currentUser,
    setSelectedBuilding,
    setSearchKeyword,
    setSortBy
  } = useAppStore();

  const [mainTab, setMainTab] = useState(0);
  const [itemSubTab, setItemSubTab] = useState(0);
  const [serviceSubTab, setServiceSubTab] = useState(0);
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const mainTabs = ['物品交换', '上门代办'];
  const itemSubTabs = ['全部', '可交换', '求购/求借'];
  const serviceSubTabs = ['全部', '跑腿代办', '志愿服务'];

  const mainFilters = [
    { key: 'all', label: '全部楼栋' },
    ...mockCommunity.buildings.map(b => ({ key: b, label: b, hasDropdown: false }))
  ];

  const itemCategories = [{ key: 'all', label: '全部分类' }, ...getItemCategories().map(c => ({ key: c, label: c }))];
  const serviceCategories = [{ key: 'all', label: '全部分类' }, ...getServiceCategories().map(c => ({ key: c, label: c }))];

  const sortOptions = [
    { key: 'time', label: '最新发布' },
    { key: 'distance', label: '距离最近' },
    { key: 'rating', label: '评分最高' }
  ];

  const sortItems = (list: any[]) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'time':
        return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'distance':
        return sorted.sort((a, b) => {
          const aSameBuilding = a.building === currentUser.building;
          const bSameBuilding = b.building === currentUser.building;
          if (aSameBuilding && !bSameBuilding) return -1;
          if (!aSameBuilding && bSameBuilding) return 1;
          const aSameUnit = aSameBuilding && a.unit === currentUser.unit;
          const bSameUnit = bSameBuilding && b.unit === currentUser.unit;
          if (aSameUnit && !bSameUnit) return -1;
          if (!aSameUnit && bSameUnit) return 1;
          return 0;
        });
      case 'rating':
        return sorted.sort((a, b) =>
          (b.publisher?.rating || 0) - (a.publisher?.rating || 0)
        );
      default:
        return sorted;
    }
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => item.status === 'available');

    if (mainTab !== 0) return [];

    if (itemSubTab === 1) result = result.filter(i => i.type === 'exchange');
    if (itemSubTab === 2) result = result.filter(i => i.type === 'needed');

    if (selectedBuilding) {
      result = result.filter(i => i.building === selectedBuilding);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(keyword) ||
        i.description.toLowerCase().includes(keyword)
      );
    }

    return sortItems(result);
  }, [items, mainTab, itemSubTab, selectedBuilding, categoryFilter, searchKeyword, sortBy, currentUser]);

  const filteredServices = useMemo(() => {
    let result = services.filter(s => s.status === 'open');

    if (mainTab !== 1) return [];

    if (serviceSubTab === 1) result = result.filter(s => s.type === 'errand');
    if (serviceSubTab === 2) result = result.filter(s => s.type === 'helper');

    if (selectedBuilding) {
      result = result.filter(s => s.building === selectedBuilding);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(s => s.category === categoryFilter);
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(keyword) ||
        s.description.toLowerCase().includes(keyword)
      );
    }

    return sortItems(result);
  }, [services, mainTab, serviceSubTab, selectedBuilding, categoryFilter, searchKeyword, sortBy, currentUser]);

  const handleRefresh = () => {
    console.log('[Square] Pull to refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  };

  const handleItemClick = (id: string) => {
    console.log('[Square] Item clicked:', id);
    Taro.navigateTo({ url: '/pages/detail/index?id=' + id + '&type=item' });
  };

  const handleServiceClick = (id: string) => {
    console.log('[Square] Service clicked:', id);
    Taro.navigateTo({ url: '/pages/detail/index?id=' + id + '&type=service' });
  };

  const handleBuildingSelect = (key: string) => {
    setSelectedBuilding(key === 'all' ? '' : key);
    setShowBuildingDropdown(false);
    console.log('[Square] Building selected:', key);
  };

  const handleMainTabChange = (index: number) => {
    setMainTab(index);
    setCategoryFilter('all');
    console.log('[Square] Main tab changed:', index);
  };

  const displayData = mainTab === 0 ? filteredItems : filteredServices;
  const exchangeCount = items.filter(i => i.status === 'available').length;
  const serviceCount = services.filter(s => s.status === 'open').length;

  return (
    <ScrollView
      scrollY
      className={styles.squarePage}
      onScrollToLower={() => console.log('[Square] Load more')}
    >
      <View className={styles.pageHeader}>
        <Text className={styles.pageTitle}>👋 欢迎来到社区广场</Text>
        <Text className={styles.pageSubtitle}>
          {mockCommunity.name} · 邻里互助，资源共享
        </Text>

        <View className={styles.quickStats}>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{exchangeCount}</Text>
            <Text className={styles.statLabel}>可交换物品</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNumber}>{serviceCount}</Text>
            <Text className={styles.statLabel}>代办需求</Text>
          </View>
        </View>

        <SearchBar
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder={mainTab === 0 ? '搜索物品名称或描述...' : '搜索服务需求...'}
        />
      </View>

      <View className={styles.filterSection}>
        <FilterBar
          filters={mainFilters}
          activeKey={selectedBuilding || 'all'}
          onChange={handleBuildingSelect}
          openDropdown={showBuildingDropdown ? 'building' : undefined}
        />
      </View>

      <View className={styles.categoryTabs}>
        <TabSegment
          tabs={mainTabs}
          activeIndex={mainTab}
          onChange={handleMainTabChange}
        />
      </View>

      {mainTab === 0 && (
        <View className={styles.categoryTabs}>
          <TabSegment
            tabs={itemSubTabs}
            activeIndex={itemSubTab}
            onChange={(i) => { setItemSubTab(i); console.log('[Square] Item sub tab:', i); }}
          />
        </View>
      )}

      {mainTab === 1 && (
        <View className={styles.categoryTabs}>
          <TabSegment
            tabs={serviceSubTabs}
            activeIndex={serviceSubTab}
            onChange={(i) => { setServiceSubTab(i); console.log('[Square] Service sub tab:', i); }}
          />
        </View>
      )}

      <View className={styles.filterSection}>
        <FilterBar
          filters={mainTab === 0 ? itemCategories : serviceCategories}
          activeKey={categoryFilter}
          onChange={(key) => { setCategoryFilter(key); console.log('[Square] Category:', key); }}
        />
      </View>

      <View className={styles.sortBar}>
        <Text className={styles.sortLabel}>排序：</Text>
        {sortOptions.map(option => (
          <Button
            key={option.key}
            className={`${styles.sortBtn} ${sortBy === option.key ? styles.sortBtnActive : ''}`}
            onClick={() => {
              setSortBy(option.key as any);
              console.log('[Square] Sort by:', option.key);
            }}
          >
            {option.key === 'time' ? '🕐' : option.key === 'distance' ? '📍' : '⭐'}
            {option.label}
          </Button>
        ))}
      </View>

      <View className={styles.listContainer}>
        {displayData.length === 0 ? (
          <EmptyState
            icon={mainTab === 0 ? '📦' : '🛠️'}
            title={mainTab === 0 ? '暂无物品' : '暂无需求'}
            description={mainTab === 0 ? '还没有可交换的物品，去发布一个吧！' : '还没有代办需求，去发布一个吧！'}
          />
        ) : (
          displayData.map((item: any) => (
            mainTab === 0 ? (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item.id)}
              />
            ) : (
              <ServiceCard
                key={item.id}
                service={item}
                onClick={() => handleServiceClick(item.id)}
              />
            )
          ))
        )}

        {displayData.length > 0 && (
          <View className={styles.loadingMore}>
            <Text>— 已经到底啦 —</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SquarePage;
