import React, { useEffect } from 'react';
import { Button, Card } from '../ui';
import { PortfolioForm } from './PortfolioForm';
import type { PortfolioAsset } from '../../types/finance';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: PortfolioAsset) => void;
  initialData?: PortfolioAsset | null;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isEditing = Boolean(initialData);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-modal-title"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2
              id="portfolio-modal-title"
              className="text-lg font-semibold"
            >
              {isEditing ? 'Edit Portfolio Asset' : 'Add Portfolio Asset'}
            </h2>

            <p className="text-sm text-text-muted">
              {isEditing
                ? 'Update your portfolio asset.'
                : 'Add an asset to your portfolio.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close portfolio modal"
          >
            ✕
          </Button>
        </div>

        <PortfolioForm
          key={initialData?.id ?? 'new'}
          onSubmit={onSubmit}
          onCancel={onClose}
          initialData={initialData}
        />
      </Card>
    </div>
  );
};
