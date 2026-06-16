import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TabSegmentProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const TabSegment: React.FC<TabSegmentProps> = ({ tabs, activeIndex, onChange }) => {
  return (
    <View className={styles.tabSegment}>
      {tabs.map((tab, index) => (
        <Text
          key={index}
          className={classnames(styles.tabItem, {
            [styles.active]: index === activeIndex
          })}
          onClick={() => onChange(index)}
        >
          {tab}
        </Text>
      ))}
    </View>
  );
};

export default TabSegment;
