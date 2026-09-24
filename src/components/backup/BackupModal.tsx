import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button, Card, Badge } from '../ui';
import type {
  Account,
  AppBackupData,
  Budget,
  PortfolioAsset,
  Transaction,
} from '../../types/finance';
import {
  createBackupPayload,
  downloadFile,
  exportAccountsToCSV,
  exportBudgetsToCSV,
  exportPortfolioToCSV,
  exportTransactionsToCSV,
  mergeBackupData,
  validateBackupPayload,
  type BackupValidationResult,
} from '../../utils/backup';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  portfolio: PortfolioAsset[];
  budgets: Budget[];
  onRestore: (data: AppBackupData) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  portfolio,
  budgets,
  onRestore,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreResult, setRestoreResult] =
    useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setRestoreFile(null);
    setRestoreResult(null);
    setStatusMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) {
    return null;
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Full JSON export
  const handleExportJSON = () => {
    const payload = createBackupPayload(
      accounts,
      transactions,
      portfolio,
      budgets
    );
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(
      jsonStr,
      `finance-dashboard-backup-${todayStr}.json`,
      'application/json;charset=utf-8'
    );
    setStatusMessage({
      text: 'Full JSON backup downloaded successfully.',
      type: 'success',
    });
  };

  // CSV exports
  const handleExportTransactionsCSV = () => {
    const csv = exportTransactionsToCSV(transactions, accounts);
    downloadFile(
      csv,
      `transactions-${todayStr}.csv`,
      'text/csv;charset=utf-8'
    );
    setStatusMessage({
      text: 'Transactions CSV downloaded successfully.',
      type: 'success',
    });
  };

  const handleExportAccountsCSV = () => {
    const csv = exportAccountsToCSV(accounts);
    downloadFile(
      csv,
      `accounts-${todayStr}.csv`,
      'text/csv;charset=utf-8'
    );
    setStatusMessage({
      text: 'Accounts CSV downloaded successfully.',
      type: 'success',
    });
  };

  const handleExportPortfolioCSV = () => {
    const csv = exportPortfolioToCSV(portfolio);
    downloadFile(
      csv,
      `portfolio-${todayStr}.csv`,
      'text/csv;charset=utf-8'
    );
    setStatusMessage({
      text: 'Portfolio CSV downloaded successfully.',
      type: 'success',
    });
  };

  const handleExportBudgetsCSV = () => {
    const csv = exportBudgetsToCSV(budgets);
    downloadFile(
      csv,
      `budgets-${todayStr}.csv`,
      'text/csv;charset=utf-8'
    );
    setStatusMessage({
      text: 'Budgets CSV downloaded successfully.',
      type: 'success',
    });
  };

  // File selection for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setRestoreFile(file);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const result = validateBackupPayload(parsed);
        setRestoreResult(result);
      } catch {
        setRestoreResult({
          valid: false,
          errors: ['Failed to parse file: invalid JSON format.'],
        });
      }
    };
    reader.onerror = () => {
      setRestoreResult({
        valid: false,
        errors: ['Error reading file from disk.'],
      });
    };
    reader.readAsText(file);
  };

  // Execute restore
  const handleApplyRestore = () => {
    if (!restoreResult?.data || !restoreResult.valid) {
      return;
    }

    const confirmation = window.confirm(
      restoreMode === 'replace'
        ? 'Warning: This will REPLACE all your existing accounts, transactions, portfolio assets, and budgets with the backup data. Continue?'
        : 'This will MERGE incoming backup data with your current records. Continue?'
    );

    if (!confirmation) {
      return;
    }

    let finalData: AppBackupData;

    if (restoreMode === 'replace') {
      finalData = restoreResult.data;
    } else {
      const current = createBackupPayload(
        accounts,
        transactions,
        portfolio,
        budgets
      );
      finalData = mergeBackupData(current, restoreResult.data);
    }

    onRestore(finalData);

    setStatusMessage({
      text: `Data restored successfully in ${restoreMode} mode!`,
      type: 'success',
    });

    setRestoreFile(null);
    setRestoreResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 id="backup-modal-title" className="text-lg font-semibold">
              Data Management & Backup
            </h2>
            <p className="text-xs text-text-muted">
              Export data for safekeeping or restore from a previous backup.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </Button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-border mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'export'
                ? 'border-premium text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Export & Backup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'restore'
                ? 'border-premium text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Restore & Import
          </button>
        </div>

        {/* Status Message feedback */}
        {statusMessage && (
          <div
            className={`mt-4 rounded-lg p-3 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-positive/10 text-positive border border-positive/20'
                : 'bg-negative/10 text-negative border border-negative/20'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* TAB 1: EXPORT & BACKUP */}
        {activeTab === 'export' && (
          <div className="space-y-6 pt-4">
            {/* Full JSON Backup */}
            <div className="rounded-xl border border-border bg-surface-elevated/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Full Database Backup (JSON)
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Save a complete snapshot containing all {accounts.length} accounts,{' '}
                    {transactions.length} transactions, {portfolio.length} portfolio assets,
                    and {budgets.length} budgets.
                  </p>
                </div>
                <Badge variant="premium">Recommended</Badge>
              </div>

              <Button
                size="sm"
                onClick={handleExportJSON}
                className="w-full sm:w-auto"
              >
                Download JSON Backup
              </Button>
            </div>

            {/* Individual CSV Exports */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Export Tabular Data (CSV)
                </h3>
                <p className="text-xs text-text-muted">
                  Export specific datasets to open in Microsoft Excel, Google Sheets, or Numbers.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportTransactionsCSV}
                  className="justify-start text-xs"
                >
                  📄 Export Transactions ({transactions.length})
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportAccountsCSV}
                  className="justify-start text-xs"
                >
                  🏦 Export Accounts ({accounts.length})
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportPortfolioCSV}
                  className="justify-start text-xs"
                >
                  📈 Export Portfolio ({portfolio.length})
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportBudgetsCSV}
                  className="justify-start text-xs"
                >
                  🎯 Export Budgets ({budgets.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESTORE & IMPORT */}
        {activeTab === 'restore' && (
          <div className="space-y-4 pt-4">
            <div className="rounded-xl border border-dashed border-border bg-surface-elevated/20 p-5 text-center space-y-3">
              <p className="text-sm font-medium text-text-primary">
                Select a JSON backup file to restore
              </p>
              <p className="text-xs text-text-muted">
                Must be a valid backup exported from Finance Dashboard.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="block w-full text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:bg-surface file:text-xs file:font-medium file:text-text-primary hover:file:bg-surface-elevated cursor-pointer"
              />

              {restoreFile && (
                <p className="text-xs font-semibold text-text-primary">
                  Selected file: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Validation errors */}
            {restoreResult && !restoreResult.valid && (
              <div className="rounded-lg bg-negative/10 border border-negative/20 p-3 text-xs text-negative space-y-1">
                <p className="font-semibold">Invalid backup file:</p>
                <ul className="list-disc list-inside">
                  {restoreResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation success & summary */}
            {restoreResult?.valid && restoreResult.summary && (
              <div className="rounded-xl border border-border bg-surface-elevated/40 p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      Backup Verified
                    </span>
                    <Badge variant="positive">Valid Format</Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Export date:{' '}
                    {new Date(
                      restoreResult.data?.exportedAt ?? ''
                    ).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-surface p-2 border border-border">
                    <span className="text-text-muted">Accounts:</span>{' '}
                    <span className="font-semibold text-text-primary">
                      {restoreResult.summary.accountsCount}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface p-2 border border-border">
                    <span className="text-text-muted">Transactions:</span>{' '}
                    <span className="font-semibold text-text-primary">
                      {restoreResult.summary.transactionsCount}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface p-2 border border-border">
                    <span className="text-text-muted">Portfolio Assets:</span>{' '}
                    <span className="font-semibold text-text-primary">
                      {restoreResult.summary.portfolioCount}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface p-2 border border-border">
                    <span className="text-text-muted">Budgets:</span>{' '}
                    <span className="font-semibold text-text-primary">
                      {restoreResult.summary.budgetsCount}
                    </span>
                  </div>
                </div>

                {/* Restore Strategy Selection */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Restore Strategy:
                  </span>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="text-premium focus:ring-focus"
                      />
                      <span>Replace All</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="text-premium focus:ring-focus"
                      />
                      <span>Merge with Current</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRestoreFile(null);
                      setRestoreResult(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Clear
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyRestore}
                  >
                    Apply {restoreMode === 'replace' ? 'Replacement' : 'Merge'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
