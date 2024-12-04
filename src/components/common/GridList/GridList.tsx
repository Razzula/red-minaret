import React from 'react';

interface GridListProps {
    children: React.ReactNode;
    columns?: number;
    rows?: number;
}

const GridList: React.FC<GridListProps> = ({ children, columns, rows }) => {
    if (!columns && !rows) {
        throw new Error('You must specify either "columns" or "rows".');
    }

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : `repeat(auto-fit, minmax(0, 1fr))`,
        gridTemplateRows: rows ? `repeat(${rows}, auto)` : 'auto',
        gap: '0.5rem',
    };

    return <div style={gridStyle}>{children}</div>;
};

export default GridList;
