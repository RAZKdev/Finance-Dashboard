import React from 'react';
import { Button, Card, Input, SectionHeader } from '../ui';

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  value,
  onChange,
  onSearch,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Quick Search"
        description="Search your financial records."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search transactions..."
          className="flex-1"
        />

        <Button variant="secondary" onClick={onSearch}>
          Search
        </Button>
      </div>
    </Card>
  );
};
