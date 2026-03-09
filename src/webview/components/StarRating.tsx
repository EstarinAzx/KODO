import { h } from 'preact';
import { useState } from 'preact/hooks';

interface StarRatingProps {
    rating: number;
    count?: number;
    interactive?: boolean;
    onRate?: (stars: number) => void;
}

export function StarRating({ rating, count, interactive, onRate }: StarRatingProps) {
    const [hoverStar, setHoverStar] = useState(0);

    const stars = [1, 2, 3, 4, 5];
    const displayRating = hoverStar || rating;

    return (
        <div class="flex items-center gap-1">
            <div class="flex items-center gap-0.5">
                {stars.map(star => (
                    <span
                        key={star}
                        class={`kodo-star ${displayRating >= star ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                        onClick={() => interactive && onRate?.(star)}
                        onMouseEnter={() => interactive && setHoverStar(star)}
                        onMouseLeave={() => interactive && setHoverStar(0)}
                    >
                        {displayRating >= star ? '★' : '☆'}
                    </span>
                ))}
            </div>
            {rating > 0 && (
                <span class="text-xs" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.7 }}>
                    {rating.toFixed(1)}{count !== undefined ? ` (${count})` : ''}
                </span>
            )}
        </div>
    );
}
