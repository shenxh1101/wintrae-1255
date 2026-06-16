import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SearchBarProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value: propValue,
  placeholder = '搜索物品或服务...',
  onChange,
  onSearch
}) => {
  const [internalValue, setInternalValue] = useState('');
  const value = propValue !== undefined ? propValue : internalValue;

  const handleChange = (e: any) => {
    const val = e.detail.value;
    if (propValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const handleClear = () => {
    if (propValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
  };

  const handleConfirm = (e: any) => {
    onSearch?.(e.detail.value);
  };

  return (
    <View className={styles.searchBar}>
      <Text className={styles.searchIcon}>🔍</Text>
      <Input
        className={styles.searchInput}
        type='text'
        value={value}
        placeholder={placeholder}
        placeholderClass={styles.placeholder}
        onInput={handleChange}
        onConfirm={handleConfirm}
        confirmType='search'
      />
      {value && (
        <Text
          className={styles.clearBtn}
          onClick={handleClear}
        >
          ✕
        </Text>
      )}
    </View>
  );
};

export default SearchBar;
