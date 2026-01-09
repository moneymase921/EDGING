'use client';

import { useMemo, useState } from 'react';
import { SlipSnapshot, ProbabilitySource } from '@/lib/types';
import { binByProbability, summaryStats, filterBySegments, SegmentFilterOptions, SummaryStats, BinResult } from '@/lib/calibration';
import { PageContainer, PageHeader, Card, StatValue, DataTable } from '@/components/ui';

type Props = {
  slips: SlipSnapshot[];
};

type DateRangeOption = 'all' | 7 | 30 | 90;

const sourceOptions: (ProbabilitySource | 'all')[] = ['all', 'override', 'devigPair', 'singleOdds'];
const dateOptions: DateRangeOption[] = ['all', 7, 30, 90];

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

export default function ReportsClient({ slips }: Props) {
  const [selectedSource, setSelectedSource] = useState<ProbabilitySource | 'all'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('all');

  const settledSlips = useMemo(
    () => slips.filter(s => s.status === 'settled' && s.slipResult),
    [slips],
  );

  const legs = useMemo(
    () =>
      settledSlips.flatMap(slip =>
        slip.legs.map((leg, idx) => ({
          ...leg,
          legIndex: idx + 1,
          slipCreatedAt: slip.createdAt,
          legResult: idx === 0 ? slip.leg1Result : slip.leg2Result,
        })),
      ),
    [settledSlips],
  );

  const applyFilters = (options: SegmentFilterOptions) => {
    const filteredLegs = filterBySegments(
      legs,
      l => l.probabilitySource,
      l => toDate(l.slipCreatedAt),
      options,
    );

    const filteredSlips = settledSlips.filter(slip => {
      const sourceMatch =
        !options.source ||
        options.source === 'all' ||
        slip.legs.some(l => l.probabilitySource === options.source);

      if (!sourceMatch) return false;

      if (options.dateRangeDays) {
        const created = toDate(slip.createdAt);
        if (!created) return false;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - options.dateRangeDays);
        if (created < cutoff) return false;
      }
      return true;
    });

    return { filteredLegs, filteredSlips };
  };

  const { filteredLegs, filteredSlips } = useMemo(() => {
    const options: SegmentFilterOptions = {
      source: selectedSource,
      dateRangeDays: selectedDateRange === 'all' ? undefined : selectedDateRange,
    };
    return applyFilters(options);
  }, [selectedSource, selectedDateRange, legs, settledSlips]);

  const legStats = useMemo(
    () => summaryStats(filteredLegs, l => l.pChosen, l => (l.legResult === 'hit' ? 1 : 0)),
    [filteredLegs],
  );

  const slipStats = useMemo(
    () => summaryStats(filteredSlips, s => s.pSlip, s => (s.slipResult === 'win' ? 1 : 0)),
    [filteredSlips],
  );

  const legBins = useMemo(
    () => binByProbability(filteredLegs, l => l.pChosen, l => (l.legResult === 'hit' ? 1 : 0)),
    [filteredLegs],
  );

  const slipBins = useMemo(
    () => binByProbability(filteredSlips, s => s.pSlip, s => (s.slipResult === 'win' ? 1 : 0)),
    [filteredSlips],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Calibration & Reports"
        subtitle="Analyze prediction accuracy across settled slips and legs."
        active="reports"
      />

      <div className="space-y-8">
        {/* Filters */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Filters</h3>
          <div className="flex flex-wrap gap-6 items-end">
            <div className="min-w-[180px]">
              <label className="text-xs text-slate-400 block mb-1">Probability Source</label>
              <select
                className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-slate-100 text-sm"
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value as ProbabilitySource | 'all')}
              >
                {sourceOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? 'All sources' : opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-slate-400 block mb-1">Date Range</label>
              <select
                className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 text-slate-100 text-sm"
                value={selectedDateRange}
                onChange={e => setSelectedDateRange((e.target.value === 'all' ? 'all' : Number(e.target.value)) as DateRangeOption)}
              >
                {dateOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? 'All time' : `Last ${opt} days`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Showing settled slips only. Filters apply to legs (probability source) and to slips by created date.
          </p>
        </Card>

        {/* Leg-Level Calibration */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Leg-Level Calibration</h2>
          <p className="text-sm text-slate-400">
            Predicted = leg pChosen; Actual = 1 if legResult is hit else 0. Delta = hit rate - avg predicted.
          </p>
          <StatsPanel stats={legStats} />
          <BinTable bins={legBins} />
        </section>

        {/* Slip-Level Calibration */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Slip-Level Calibration</h2>
          <p className="text-sm text-slate-400">
            Predicted = slip pSlip; Actual = 1 if slipResult is win else 0. Assumes leg independence when computing pSlip.
          </p>
          <StatsPanel stats={slipStats} />
          <BinTable bins={slipBins} />
        </section>
      </div>
    </PageContainer>
  );
}

type StatsPanelProps = {
  stats: SummaryStats;
};

function StatsPanel({ stats }: StatsPanelProps) {
  const deltaColor = stats.delta !== null 
    ? (stats.delta > 0.02 ? 'positive' : stats.delta < -0.02 ? 'negative' : 'default') 
    : 'default';

  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatValue label="Count" value={stats.count} />
        <StatValue label="Hit Rate" value={toPct(stats.hitRate)} />
        <StatValue label="Avg Predicted" value={toPct(stats.avgPredicted)} />
        <StatValue label="Delta (Hit - Pred)" value={toPct(stats.delta, true)} color={deltaColor as 'positive' | 'negative' | 'default'} />
        <StatValue label="Brier Score" value={stats.brier !== null ? stats.brier.toFixed(4) : '—'} />
      </div>
    </Card>
  );
}

type BinTableProps = {
  bins: BinResult[];
};

function BinTable({ bins }: BinTableProps) {
  return (
    <DataTable
      columns={[
        { header: 'Probability Range', accessor: 'rangeLabel', align: 'left' },
        { header: 'Count', accessor: 'count', align: 'right' },
        { header: 'Avg Predicted', accessor: (row) => toPct(row.avgPredicted), align: 'right' },
        { header: 'Hit Rate', accessor: (row) => toPct(row.hitRate), align: 'right' },
        { 
          header: 'Delta', 
          accessor: (row) => {
            const delta = row.delta ?? 0;
            const deltaColor = delta > 0.02 ? 'text-emerald-400' : delta < -0.02 ? 'text-rose-400' : 'text-slate-300';
            return <span className={deltaColor}>{toPct(row.delta, true)}</span>;
          }, 
          align: 'right' 
        },
      ]}
      data={bins}
      rowClassName={(row) => row.count === 0 ? 'opacity-40' : ''}
    />
  );
}

function toPct(value: number | null | undefined, signed = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const pct = (value * 100).toFixed(1);
  if (signed && value > 0) return `+${pct}%`;
  return `${pct}%`;
}
