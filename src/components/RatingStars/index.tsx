import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  readOnly?: boolean;
  onChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  readOnly = true,
  onChange
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (star: number) => {
    if (readOnly || !onChange) return;
    onChange(star);
  };

  const displayRating = hoverRating || rating;

  return (
    <View className={classnames(styles.ratingStars, {
      [styles.readOnly]: readOnly,
      [styles.clickable]: !readOnly
    })}>
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <Text
          key={star}
          className={classnames(styles.star, {
            [styles.active]: star <= displayRating
          })}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
        >
          ★
        </Text>
      ))}
    </View>
  );
};

export default RatingStars;
