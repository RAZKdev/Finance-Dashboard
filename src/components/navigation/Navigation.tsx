import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  'Overview',
  'Accounts',
  'Transactions',
  'Budgets',
  'Cashflow',
  'Portfolio',
  'Markets',
  'Settings',
  'Backup',
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? 'border-premium text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t(`nav.${tab}`)}
          </button>
        ))}
      </div>
    </nav>
  );
};
