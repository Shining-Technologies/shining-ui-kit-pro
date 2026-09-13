'use client'

import { DonutChart, TrendChart } from '@shining-technologies/ui/charts'

const TREND = [
  { month: 'Jan', revenue: 120, costs: 80 },
  { month: 'Feb', revenue: 150, costs: 95 },
  { month: 'Mar', revenue: 170, costs: 90 },
  { month: 'Apr', revenue: 160, costs: 110 },
  { month: 'May', revenue: 210, costs: 120 },
  { month: 'Jun', revenue: 240, costs: 130 },
]

export function ChartsDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div data-testid="trend">
        <TrendChart
          title="Revenue"
          data={TREND}
          xKey="month"
          series={[
            { key: 'revenue', label: 'Revenue' },
            { key: 'costs', label: 'Costs' },
          ]}
          variant="area"
        />
      </div>
      <div data-testid="donut">
        <DonutChart
          title="Plans"
          data={[
            { key: 'free', label: 'Free', value: 320 },
            { key: 'pro', label: 'Pro', value: 140 },
            { key: 'team', label: 'Team', value: 40 },
          ]}
          centerValue="500"
          centerLabel="users"
        />
      </div>
    </div>
  )
}
