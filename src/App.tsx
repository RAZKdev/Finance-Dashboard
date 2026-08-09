import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Input,
  SectionHeader,
  StatCard,
} from './components/ui';

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Portfolio', 'Markets', 'Transactions'];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold">Finance Dashboard</h1>
            <p className="text-xs text-text-muted">
              Personal finance overview
            </p>
          </div>

          <Badge variant="positive">Market Open</Badge>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-premium text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <SectionHeader
          title={activeTab}
          description="Track your financial position and portfolio performance."
          action={
            <Button size="sm" onClick={() => alert('Add transaction')}>
              + Add
            </Button>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Balance"
            value="Rp 25.450.000"
            change="+8.4%"
            trend="up"
          />

          <StatCard
            label="Portfolio"
            value="Rp 18.200.000"
            change="+5.7%"
            trend="up"
          />

          <StatCard
            label="Monthly Income"
            value="Rp 7.500.000"
            change="+12.1%"
            trend="up"
          />

          <StatCard
            label="Monthly Expense"
            value="Rp 3.250.000"
            change="-4.2%"
            trend="down"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeader
              title="Portfolio Overview"
              description="Current allocation across your assets."
            />

            <div className="space-y-4">
              {[
                ['Stocks', 'Rp 10.500.000', '57.7%'],
                ['Crypto', 'Rp 4.200.000', '23.1%'],
                ['Cash', 'Rp 2.500.000', '13.7%'],
                ['Other', 'Rp 1.000.000', '5.5%'],
              ].map(([name, value, percentage]) => (
                <div
                  key={name}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-text-muted">{percentage}</p>
                  </div>

                  <p className="text-sm font-semibold tabular-nums">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="Recent Transactions"
              description="Latest activity in your account."
            />

            <div className="space-y-4">
              {[
                ['Salary', '+ Rp 7.500.000', 'positive'],
                ['Investment', '- Rp 2.000.000', 'negative'],
                ['Food', '- Rp 150.000', 'negative'],
                ['Freelance', '+ Rp 750.000', 'positive'],
              ].map(([name, amount, type]) => (
                <div
                  key={name}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                >
                  <p className="text-sm font-medium">{name}</p>

                  <Badge
                    variant={type === 'positive' ? 'positive' : 'negative'}
                  >
                    {amount}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </section>

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
      </main>
    </div>
  );
}

export default App;
