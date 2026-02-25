import React, { useState } from 'react';
import './Tabs.css';

interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    activeTab?: string;
    onTabChange?: (id: string) => void;
}

export default function Tabs({ tabs, defaultTab, activeTab: controlledActiveTab, onTabChange }: TabsProps) {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
    const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

    const handleTabClick = (id: string) => {
        if (onTabChange) {
            onTabChange(id);
        } else {
            setInternalActiveTab(id);
        }
    };

    return (
        <div className="tabs-container">
            <div className="tabs-header">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tabs-content">
                {tabs.map((tab) => (
                    activeTab === tab.id && (
                        <div key={tab.id} role="tabpanel" className="tab-content">
                            {tab.content}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
