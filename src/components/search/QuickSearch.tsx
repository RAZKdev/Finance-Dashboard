import React from 'react';
import { Button, Card, Input, SectionHeader } from '../ui';

export const QuickSearch: React.FC = () => {
  return (
    <Card>
      <SectionHeader
        title="Quick Search"
        description="Search your financial records."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search transactions..."
          className="flex-1"
        />

        <Button variant="secondary">Search</Button>
      </div>
    </Card>
  );
};
