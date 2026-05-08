import { useState } from "react";
import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export function RatingStars({
  value,
  onChange,
  size = 28,
  readonly = false,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const normalized = Math.max(0, Math.min(5, value));
  const displayValue = hoverValue ?? normalized;

  const renderStars = (interactive: boolean) =>
    Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const starFill = Math.max(0, Math.min(1, displayValue - index));
      const starValueHalf = starNumber - 0.5;
      const starValueFull = starNumber;
      const isFull = starFill >= 1;
      const isHalf = starFill >= 0.5 && starFill < 1;

      return (
        <div
          key={starNumber}
          className={`star-btn ${interactive ? "interactive" : "readonly"}`}
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <span className="star-icon-box">
            {isFull ? <Star size={size} fill="currentColor" /> : null}
            {isHalf ? <StarHalf size={size} fill="currentColor" /> : null}
            {!isFull && !isHalf ? <Star size={size} /> : null}
          </span>
          {interactive ? (
            <>
              <button
                type="button"
                className="star-hitbox left"
                aria-label={`${starValueHalf} estrela(s)`}
                onMouseEnter={() => setHoverValue(starValueHalf)}
                onFocus={() => setHoverValue(starValueHalf)}
                onClick={() => onChange?.(starValueHalf)}
              />
              <button
                type="button"
                className="star-hitbox right"
                aria-label={`${starValueFull} estrela(s)`}
                onMouseEnter={() => setHoverValue(starValueFull)}
                onFocus={() => setHoverValue(starValueFull)}
                onClick={() => onChange?.(starValueFull)}
              />
            </>
          ) : null}
        </div>
      );
    });

  return (
    <div
      className={`rating-stars ${readonly ? "readonly-stars" : "input-stars"}`}
      onMouseLeave={() => {
        if (!readonly) {
          setHoverValue(null);
        }
      }}
    >
      {renderStars(!readonly)}
      {!readonly ? <small className="stars-tip">Toque na metade esquerda/direita da estrela.</small> : null}
    </div>
  );
}
