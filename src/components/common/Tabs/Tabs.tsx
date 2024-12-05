import React, { useState, ReactNode } from 'react';

interface TabProps {
    label: ReactNode;
    children: ReactNode;
}

interface TabsProps {
    children: ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => <div>{children}</div>;

export const Tabs: React.FC<TabsProps> = ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = React.Children.toArray(children) as React.ReactElement<TabProps>[];

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap', // Allow wrapping to multiple rows
                    borderBottom: '0px solid #505050',
                }}
            >
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        style={{
                            flex: '1 0 auto',
                            border: 'none',
                            borderBottom: activeTab === index ? '3px solid #007acc' : 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === index ? 'bold' : 'normal',
                            color: activeTab === index ? '#007acc' : '#ffffff',
                        }}
                    >
                        {tab.props.label}
                    </button>
                ))}
            </div>
            <div style={{ padding: '1rem' }}>{tabs[activeTab]}</div>
        </div>
    );
};

export default Tabs;
