import React, { useEffect, useState } from 'react';
import { ApiClient } from 'adminjs';
import { Box, H2, H5, Text, Button } from '@adminjs/design-system';
import { styled } from '@adminjs/design-system/styled-components';

const api = new ApiClient();

const Card = styled(Box)`
  border-radius: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.grey20};
  background: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const StatCard = ({ title, value }) => (
  <Card p="lg" width={[1, 1 / 2, 1 / 4]}>
    <Text color="grey60" fontSize="sm">{title}</Text>
    <H2 mt="sm">{value}</H2>
  </Card>
);

const Bar = styled(Box)`
  height: 24px;
  min-width: 4px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.primary100};
`;

const ChartBar = ({ label, value, max }) => (
  <Box mb="sm">
    <Box display="flex" justifyContent="space-between" mb="xs">
      <Text fontSize="sm">{label}</Text>
      <Text fontSize="sm" fontWeight="bold">{value}</Text>
    </Box>
    <Bar width={`${max ? (value / max) * 100 : 0}%`} />
  </Box>
);

const PieSlice = styled(Box)`
  height: 12px;
  border-radius: 6px;
  background: ${({ color }) => color};
`;

const colors = ['#4268F6', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box p="xxl">
        <Text>Loading dashboard…</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="xxl">
        <Text color="error">{error}</Text>
      </Box>
    );
  }

  const { stats = {}, appointmentTrend = [], appointmentByStatus = [], recentLogs = [], pendingDoctors = [] } = data;
  const maxTrend = Math.max(...appointmentTrend.map((d) => d.count), 1);

  return (
    <Box p="xxl" data-css="custom-dashboard">
      <H2 mb="xl">Dashboard</H2>

      {/* Stats row */}
      <Box display="flex" flexWrap="wrap" mb="xxl" style={{ gap: '16px' }}>
        <StatCard title="Total Users" value={stats.totalUsers ?? 0} />
        <StatCard title="Doctors" value={stats.totalDoctors ?? 0} />
        <StatCard title="Patients" value={stats.totalPatients ?? 0} />
        <StatCard title="Appointments" value={stats.totalAppointments ?? 0} />
      </Box>

      {/* Charts row */}
      <Box display="flex" flexWrap="wrap" mb="xxl" style={{ gap: '24px' }}>
        <Card p="lg" width={[1, 1, 2 / 3]}>
          <H5 mb="lg">Appointments trend (last 14 days)</H5>
          {appointmentTrend.length === 0 ? (
            <Text color="grey60">No data</Text>
          ) : (
            appointmentTrend.map(({ date, count }) => (
              <ChartBar key={date} label={date} value={count} max={maxTrend} />
            ))
          )}
        </Card>
        <Card p="lg" width={[1, 1, 1 / 3]}>
          <H5 mb="lg">By status</H5>
          {appointmentByStatus.length === 0 ? (
            <Text color="grey60">No data</Text>
          ) : (
            appointmentByStatus.map((item, i) => (
              <Box key={item.name} display="flex" alignItems="center" mb="sm">
                <PieSlice color={colors[i % colors.length]} width="12px" mr="sm" />
                <Text fontSize="sm">{item.name}: {item.value}</Text>
              </Box>
            ))
          )}
        </Card>
      </Box>

      {/* Recent logs & Pending doctors */}
      <Box display="flex" flexWrap="wrap" style={{ gap: '24px' }}>
        <Card p="lg" width={[1, 1, 1 / 2]}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
            <H5>Recent logs</H5>
            <Button as="a" href="./resources/AuditLog/records" size="sm" variant="text">
              Show all
            </Button>
          </Box>
          {recentLogs.length === 0 ? (
            <Text color="grey60">No recent logs</Text>
          ) : (
            <Box as="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {recentLogs.map((log) => (
                <Box key={log.id} as="li" py="sm" borderBottom="1px solid" borderColor="grey20">
                  <Text fontSize="sm">
                    <strong>{log.action}</strong>
                    {log.entityType && ` · ${log.entityType}`}
                    {log.entityId && ` #${log.entityId}`}
                  </Text>
                  <Text fontSize="xs" color="grey60">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Card>
        <Card p="lg" width={[1, 1, 1 / 2]}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
            <H5>Doctors waiting verification</H5>
            <Button as="a" href="./resources/Doctor/records" size="sm" variant="text">
              Show all
            </Button>
          </Box>
          {pendingDoctors.length === 0 ? (
            <Text color="grey60">No doctors pending verification</Text>
          ) : (
            <Box as="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {pendingDoctors.map((d) => (
                <Box key={d.id} as="li" py="sm" borderBottom="1px solid" borderColor="grey20">
                  <Text fontSize="sm">
                    {d.user
                      ? `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim() || d.user.email
                      : `Doctor #${d.id}`}
                    {d.department && ` · ${d.department}`}
                  </Text>
                  {d.user?.email && (
                    <Text fontSize="xs" color="grey60">{d.user.email}</Text>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}
