import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title = '暂无数据',
  description = '这里还没有内容哦～'
}) => {
  return (
    <View className={styles.emptyState}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
    </View>
  );
};

export default EmptyState;
