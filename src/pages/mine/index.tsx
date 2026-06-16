import React from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import RatingStars from '@/components/RatingStars';
import { getRankBadge } from '@/utils';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const {
    currentUser,
    monthlyExchangeCount,
    favoriteContacts,
    leaderboard,
    bookings
  } = useAppStore();

  const myRank = leaderboard.find(l => l.userId === currentUser.id);

  const completedCount = bookings.filter(b =>
    b.status === 'completed' &&
    (b.publisherId === currentUser.id || b.responderId === currentUser.id)
  ).length;

  const handleMenuClick = (menu: string) => {
    console.log('[Mine] Menu clicked:', menu);

    switch (menu) {
      case 'leaderboard':
        Taro.navigateTo({ url: '/pages/leaderboard/index' });
        break;
      case 'report':
        Taro.navigateTo({ url: '/pages/report/index' });
        break;
      case 'rating':
        Taro.navigateTo({ url: '/pages/rating/index' });
        break;
      case 'favorites':
        Taro.showToast({ title: '收藏联系人', icon: 'none' });
        break;
      case 'settings':
        Taro.showToast({ title: '设置功能开发中', icon: 'none' });
        break;
      case 'help':
        Taro.showToast({ title: '帮助中心开发中', icon: 'none' });
        break;
      default:
        break;
    }
  };

  const handleContactClick = (userId: string) => {
    console.log('[Mine] Contact clicked:', userId);
    Taro.showToast({ title: '聊天功能开发中', icon: 'none' });
  };

  const menuItems = [
    {
      key: 'leaderboard',
      icon: '🏆',
      name: '社区互助榜',
      desc: myRank ? `当前排名第 ${myRank.rank} 名` : '查看社区排名',
      bgColor: 'rgba(255, 215, 0, 0.1)'
    },
    {
      key: 'favorites',
      icon: '⭐',
      name: '收藏联系人',
      desc: `${favoriteContacts.length} 位常用联系人`,
      bgColor: 'rgba(255, 138, 61, 0.1)'
    },
    {
      key: 'report',
      icon: '⚠️',
      name: '爽约反馈',
      desc: '对爽约用户发起反馈',
      bgColor: 'rgba(245, 63, 63, 0.1)'
    },
    {
      key: 'rating',
      icon: '⭐',
      name: '我的评价',
      desc: '查看收到的评价和打分',
      bgColor: 'rgba(255, 215, 0, 0.1)'
    },
    {
      key: 'settings',
      icon: '⚙️',
      name: '设置',
      desc: '账号、通知等设置',
      bgColor: 'rgba(134, 144, 156, 0.1)'
    },
    {
      key: 'help',
      icon: '❓',
      name: '帮助中心',
      desc: '常见问题和使用指南',
      bgColor: 'rgba(24, 144, 255, 0.1)'
    }
  ];

  const top3Leaderboard = leaderboard.slice(0, 3);

  return (
    <ScrollView scrollY className={styles.minePage}>
      <View className={styles.userHeader}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={currentUser.avatar}
            mode='aspectFill'
            onError={(e) => console.error('[Mine] Avatar error:', e)}
          />
          <View className={styles.userDetails}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <Text className={styles.userLocation}>
              📍 {currentUser.building} {currentUser.unit}
            </Text>
            {currentUser.isVolunteer && (
              <Text className={styles.volunteerBadge}>
                🤝 社区志愿者
              </Text>
            )}
            <View className={styles.ratingDisplay}>
              <RatingStars rating={Math.round(currentUser.rating)} />
              <Text className={styles.ratingValue}>{currentUser.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{monthlyExchangeCount}</Text>
              <Text className={styles.statLabel}>本月交换</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{completedCount}</Text>
              <Text className={styles.statLabel}>累计完成</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{currentUser.exchangeCount}</Text>
              <Text className={styles.statLabel}>总交换次数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{myRank?.rank || '-'}</Text>
              <Text className={styles.statLabel}>当前排名</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.contentSection}>
        {favoriteContacts.length > 0 && (
          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>
              ⭐ 常用联系人
            </Text>
            <ScrollView
              scrollX
              className={styles.favoriteList}
              showScrollbar={false}
            >
              {favoriteContacts.map((fav) => (
                <Button
                  key={fav.id}
                  className={styles.favoriteItem}
                  onClick={() => handleContactClick(fav.contact.id)}
                >
                  <Image
                    className={styles.favoriteAvatar}
                    src={fav.contact.avatar}
                    mode='aspectFill'
                    onError={(e) => console.error('[Mine] Contact avatar error:', e)}
                  />
                  <Text className={styles.favoriteName}>{fav.contact.name}</Text>
                </Button>
              ))}
            </ScrollView>
          </View>
        )}

        <View className={styles.sectionCard}>
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className={styles.sectionTitle}>
              🏆 社区互助榜
            </Text>
            <Text
              style={{ fontSize: 24, color: '#FF8A3D' }}
              onClick={() => handleMenuClick('leaderboard')}
            >
              查看全部 →
            </Text>
          </View>

          <View className={styles.leaderboardPreview}>
            {top3Leaderboard.map((item) => (
              <View key={item.userId} className={styles.leaderboardItem}>
                <View className={`${styles.rankBadge} ${
                  item.rank === 1 ? styles.rankTop1 :
                  item.rank === 2 ? styles.rankTop2 :
                  item.rank === 3 ? styles.rankTop3 : styles.rankNormal
                }`}>
                  {getRankBadge(item.rank)}
                </View>
                <View className={styles.leaderboardUser}>
                  <Image
                    className={styles.leaderboardAvatar}
                    src={item.user.avatar}
                    mode='aspectFill'
                    onError={(e) => console.error('[Mine] Leaderboard avatar error:', e)}
                  />
                  <Text className={styles.leaderboardName}>{item.user.name}</Text>
                </View>
                <Text className={styles.leaderboardScore}>{item.totalScore} 分</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            📋 功能菜单
          </Text>
          <View className={styles.menuList}>
            {menuItems.map((menu) => (
              <Button
                key={menu.key}
                className={styles.menuItem}
                onClick={() => handleMenuClick(menu.key)}
              >
                <View
                  className={styles.menuIcon}
                  style={{ background: menu.bgColor }}
                >
                  {menu.icon}
                </View>
                <View className={styles.menuText}>
                  <Text className={styles.menuName}>{menu.name}</Text>
                  <Text className={styles.menuDesc}>{menu.desc}</Text>
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </Button>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
