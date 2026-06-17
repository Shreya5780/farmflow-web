import { useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { mockCrops, mockActivities } from '../data/staticData';
import type { Activity } from '../types';
import { getRiskColor, getRiskDescription } from '../utils/riskEngine';

const ActivityTimeline: React.FC = () => {
  // Group activities by crop for timeline display
  const activitiesByCrop = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    mockActivities.forEach((activity) => {
      if (!grouped[activity.cropId]) {
        grouped[activity.cropId] = [];
      }
      grouped[activity.cropId].push(activity);
    });

    // Sort by date
    Object.keys(grouped).forEach((cropId) => {
      grouped[cropId].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    });

    return grouped;
  }, []);

  const getCropName = (cropId: string) => {
    const crop = mockCrops.find((c) => c.id === cropId);
    return crop?.name || 'Unknown';
  };

  const getActivityTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      SOW: '🌱',
      TRANSPLANT: '🌿',
      IRRIGATE: '💧',
      FERTILIZE: '🧪',
      SPRAY: '🌊',
      HARVEST: '🌾',
    };
    return icons[type] || '📌';
  };

  // Calculate timeline span
  const allActivities = mockActivities;
  const minDate = new Date(Math.min(...allActivities.map((a) => a.startDate.getTime())));
  const maxDate = new Date(Math.max(...allActivities.map((a) => a.endDate.getTime())));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const calculatePosition = (date: Date): number => {
    const days = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };

  const calculateWidth = (startDate: Date, endDate: Date): number => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        📊 Crop Calendar Timeline
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Period: {minDate.toLocaleDateString()} → {maxDate.toLocaleDateString()} ({totalDays} days)
      </Typography>

      {/* Timeline per Crop */}
      {Object.entries(activitiesByCrop).map(([cropId, activities]) => (
        <Paper key={cropId} sx={{ mb: 4, p: 3, bgcolor: '#fafafa' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            {getCropName(cropId)}
          </Typography>

          {/* Timeline Bar */}
          <Box sx={{ position: 'relative', mb: 3, minHeight: 60 }}>
            {/* Background grid */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 50,
                bgcolor: '#f0f0f0',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}
            />

            {/* Activity Bars */}
            {activities.map((activity) => (
              <Box
                key={activity.id}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: `${calculatePosition(activity.startDate)}%`,
                  width: `${calculateWidth(activity.startDate, activity.endDate)}%`,
                  height: 50,
                  backgroundColor: getRiskColor(activity.riskLevel),
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transform: 'scale(1.02)',
                  },
                  title: `${activity.type}: ${activity.startDate.toLocaleDateString()}`,
                }}
              >
                {getActivityTypeIcon(activity.type)} {activity.type}
              </Box>
            ))}
          </Box>

          {/* Activity List */}
          <Grid container spacing={2}>
            {activities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: `4px solid ${getRiskColor(activity.riskLevel)}`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: 18 }}>
                        {getActivityTypeIcon(activity.type)}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {activity.type}
                      </Typography>
                      <Chip
                        label={activity.riskLevel}
                        size="small"
                        sx={{
                          backgroundColor: getRiskColor(activity.riskLevel),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>

                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      <strong>Start:</strong> {activity.startDate.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      <strong>End:</strong> {activity.endDate.toLocaleDateString()}
                    </Typography>

                    {activity.description && (
                      <Typography variant="caption" display="block" sx={{ mb: 1, color: '#666' }}>
                        {activity.description}
                      </Typography>
                    )}

                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        Risk Score: {activity.riskScore}/100
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={activity.riskScore}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getRiskColor(activity.riskLevel),
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#999', mt: 0.5, display: 'block' }}>
                        {getRiskDescription(activity.riskLevel)}
                      </Typography>
                    </Box>

                    {activity.riskReason && (
                      <Box sx={{ mt: 1.5, p: 1, bgcolor: '#fff3e0', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: '#e65100' }}>
                          <strong>⚠️ Risk Reason:</strong> {activity.riskReason}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}

      {/* Legend */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
          📋 Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Object.entries({
            SOW: '🌱',
            TRANSPLANT: '🌿',
            IRRIGATE: '💧',
            FERTILIZE: '🧪',
            SPRAY: '🌊',
            HARVEST: '🌾',
          }).map(([type, icon]) => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{icon}</span>
              <Typography variant="caption">{type}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
            <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: getRiskColor(level as any),
                  borderRadius: '2px',
                }}
              />
              <Typography variant="caption">{level} Risk</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default ActivityTimeline;
