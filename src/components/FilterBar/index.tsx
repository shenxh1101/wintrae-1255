import React from 'react';
import { View, Text } from '@tarojs/components';
import { ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface FilterItem {
  key: string;
  label: string;
  icon?: string;
  hasDropdown?: boolean;
}

interface FilterBarProps {
  filters: FilterItem[];
  activeKey: string;
  onChange: (key: string) => void;
  openDropdown?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeKey,
  onChange,
  openDropdown
}) => {
  return (
    <ScrollView
      scrollX
      className={styles.filterBar}
      showScrollbar={false}
    >
      {filters.map((filter) => (
        <Text
          key={filter.key}
          className={classnames(styles.filterItem, {
            [styles.active]: activeKey === filter.key
          })}
          onClick={() => onChange(filter.key)}
        >
          {filter.icon && <Text className={styles.filterIcon}>{filter.icon}</Text>}
          <Text>{filter.label}</Text>
          {filter.hasDropdown && (
            <Text className={classnames(styles.dropdownIcon, {
              [styles.open]: openDropdown === filter.key
            })}>
              ▾
            </Text>
          )}
        </Text>
      ))}
    </ScrollView>
  );
};

export default FilterBar;
