import React from 'react';
import { Button, Card, Input, SectionHeader } from '../ui';

interface QuickSearchProps {
  value: string;
  activeQuery?: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  value,
  activeQuery = '',
  onChange,
  onSearch,
  onClear,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Search Transactions"
        description="Search transactions by title, category, type, or date."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search title, category, type, or date..."
          className="flex-1"
        />

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onSearch}>
            Search
          </Button>

          {activeQuery && onClear && (
            <Button variant="ghost" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
