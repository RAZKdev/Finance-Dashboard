import {
  Badge,
  Button,
  Card,
  Input,
  SectionHeader,
  Skeleton,
  StatCard,
} from './components/ui';

import './App.css';

function App() {
  return (
    <main className="min-h-screen bg-background text-text-primary p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <SectionHeader
          title="Finance Dashboard"
          description="Personal finance overview"
          action={
            <Button size="sm">
              Add Transaction
            </Button>
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Balance"
            value="$24,580"
            change="+8.4%"
            trend="up"
          />

          <StatCard
            label="Income"
            value="$8,420"
            change="+12.5%"
            trend="up"
          />

          <StatCard
            label="Expenses"
            value="$3,240"
            change="-4.2%"
            trend="down"
          />

          <StatCard
            label="Savings"
            value="$5,180"
            change="+6.8%"
            trend="up"
          />
        </section>

        <Card>
          <SectionHeader
            title="Quick Actions"
            description="Manage your financial data"
          />

          <div className="flex flex-wrap gap-3">
            <Button>Add Income</Button>
            <Button variant="secondary">Add Expense</Button>
            <Button variant="ghost">View Reports</Button>
            <Button variant="danger">Delete Data</Button>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Transaction Search"
            description="Search your financial records"
          />

          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search transactions..."
              className="flex-1"
            />

            <Button>
              Search
            </Button>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Account Status"
            description="Current dashboard state"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="positive">
              Connected
            </Badge>

            <Badge variant="warning">
              Demo Data
            </Badge>

            <Badge variant="premium">
              Premium
            </Badge>

            <Badge variant="negative">
              Alert
            </Badge>

            <Skeleton className="h-6 w-24" />
          </div>
        </Card>
      </div>
    </main>
  );
}

export default App;
