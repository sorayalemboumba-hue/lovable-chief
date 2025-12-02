import { memo } from 'react';
import { Application } from '@/types/application';
import { StatsCards } from '@/components/StatsCards';

interface DashboardStatsProps {
  applications: Application[];
}

export const DashboardStats = memo(function DashboardStats({ applications }: DashboardStatsProps) {
  return <StatsCards applications={applications} />;
});
