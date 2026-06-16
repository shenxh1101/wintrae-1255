import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useAppStore } from '@/store/useAppStore';
import { getRankBadge } from '@/utils';
import styles from './index.module.scss';

const LeaderboardPage: React.FC = () => {
  const { leaderboard, currentUser } = useAppStore();

  const myRank = useMemo(() =>
    leaderboard.find(l => l.userId === currentUser.id),
    [leaderboard, currentUser.id]
  );

  const topThree = useMemo(() =>
    leaderboard.slice(0, 3),
    [leaderboard]
  );

  const restList = useMemo(() =>
    leaderboard.slice(3),
    [leaderboard]
  );

  const totalExchanges = useMemo(() =>
    leaderboard.reduce((sum, item) => sum + item.exchangeCount, 0),
    [leaderboard]
  );

  const totalServices = useMemo(() =>
    leaderboard.reduce((sum, item) => sum + item.serviceCount, 0),
    [leaderboard]
  );

  const renderTopCard = (item: any, index: number) => {
    const rankClasses = [styles.top1, styles.top2, styles.top3];
    const rankBadgeClasses = [styles.rankTop1, styles.rankTop2, styles.rankTop3];
    const crowns = ['👑', '🥈', '🥉'];

    return (
      <View key={item.userId} className={`${styles.topCard} ${rankClasses[index]}`}>
        {index === 0 && <Text className={styles.crown}>{crowns[index]}</Text>}
        <View className={`${styles.rankBadge} ${rankBadgeClasses[index]}`}>
          {getRankBadge(item.rank)}
        </View>
        <Image
          className={styles.avatar}
          src={item.user.avatar}
          mode='aspectFill'
          onError={(e) => console.error('[Leaderboard] Avatar error:', e)}
        />
        <Text className={styles.name}>{item.user.name}</Text>
        <Text className={styles.score}>{item.totalScore}</Text>
        <Text className={styles.scoreLabel}>积分</Text>
      </View>
    );
  };

  return (
    <ScrollView scrollY className={styles.leaderboardPage}>
      <View className={styles.header}>
        <Text className={styles.title}>🏆 社区互助榜</Text>
        <Text className={styles.subtitle}>感谢每一位热心参与社区互助的邻居</Text>
      </View>

      {topThree.length > 0 && (
        <View className={styles.topThree}>
          {topThree.map((item, index) => renderTopCard(item, index))}
        </View>
      )}

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{leaderboard.length}</Text>
          <Text className={styles.statLabel}>参与人数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{totalExchanges}</Text>
          <Text className={styles.statLabel}>物品交换</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{totalServices}</Text>
          <Text className={styles.statLabel}>服务次数</Text>
        </View>
      </View>

      {myRank && (
        <View className={styles.myRankCard}>
          <Text className={styles.myRankTitle}>
            📍 我的排名
          </Text>
          <View className={styles.myRankInfo}>
            <Text className={styles.myRankNum}>
              #{myRank.rank}
            </Text>
            <View className={styles.myRankDetails}>
              <View className={styles.myRankDetailsRow}>
                <Text className={styles.myRankLabel}>互助积分</Text>
                <Text className={styles.myRankValue}>{myRank.totalScore} 分</Text>
              </View>
              <View className={styles.myRankDetailsRow}>
                <Text className={styles.myRankLabel}>物品交换</Text>
                <Text className={styles.myRankValue}>{myRank.exchangeCount} 次</Text>
              </View>
              <View className={styles.myRankDetailsRow}>
                <Text className={styles.myRankLabel}>服务次数</Text>
                <Text className={styles.myRankValue}>{myRank.serviceCount} 次</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.listSection}>
        <Text className={styles.listTitle}>
          📋 完整排行榜
        </Text>

        {leaderboard.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无排行数据</Text>
          </View>
        ) : (
          <View className={styles.list}>
            {restList.map((item) => (
              <View key={item.userId} className={styles.listItem}>
                <Text className={`${styles.rankNum} ${
                  item.rank > 3 ? styles.rankNormal : ''
                }`}>
                  {item.rank}
                </Text>
                <Image
                  className={styles.listAvatar}
                  src={item.user.avatar}
                  mode='aspectFill'
                  onError={(e) => console.error('[Leaderboard] List avatar error:', e)}
                />
                <View className={styles.userInfo}>
                  <View>
                    <Text className={styles.userName}>{item.user.name}</Text>
                    {item.user.isVolunteer && (
                      <Text className={styles.volunteerTag}>志愿者</Text>
                    )}
                  </View>
                  <Text className={styles.userDesc}>
                    {item.user.building} · 交换 {item.exchangeCount} 次 · 服务 {item.serviceCount} 次
                  </Text>
                </View>
                <Text className={styles.userScore}>{item.totalScore}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default LeaderboardPage;
