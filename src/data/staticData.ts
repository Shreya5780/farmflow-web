import type { Crop, Activity, WeatherData, ActivityType, ActivityStatus } from '../types';

// Static seed data - Crops with typical activity windows (North India-ish seasons)

const generateDate = (month: number, day: number, year: number = 2024) => 
  new Date(year, month - 1, day);

// === FARMS ===
export const mockFarms = [
  {
    id: 'farm-001',
    userId: 'user-001',
    name: 'Green Valley Farm',
    latitude: 28.7041,
    longitude: 77.1025,
    region: 'NCR',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'farm-002',
    userId: 'user-001',
    name: 'Harvest Hills',
    latitude: 30.9037,
    longitude: 75.8573,
    region: 'Punjab',
    createdAt: new Date('2024-01-15'),
  },
];

// === CROPS (with typical activity windows) ===
export const mockCrops: Crop[] = [
  {
    id: 'crop-001',
    farmId: 'farm-001',
    name: 'Wheat',
    sowDate: generateDate(11, 15), // Nov 15
    expectedHarvestDate: generateDate(4, 15), // Apr 15
    variety: 'HD2967',
    estimatedYield: 50,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'crop-002',
    farmId: 'farm-001',
    name: 'Rice',
    sowDate: generateDate(6, 1), // Jun 1
    expectedHarvestDate: generateDate(10, 31), // Oct 31
    variety: 'Basmati',
    estimatedYield: 60,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'crop-003',
    farmId: 'farm-001',
    name: 'Tomato',
    sowDate: generateDate(7, 1), // Jul 1
    expectedHarvestDate: generateDate(11, 30), // Nov 30
    variety: 'Roma',
    estimatedYield: 45,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'crop-004',
    farmId: 'farm-002',
    name: 'Mustard',
    sowDate: generateDate(10, 1), // Oct 1
    expectedHarvestDate: generateDate(3, 15), // Mar 15
    variety: 'Varuna',
    estimatedYield: 20,
    createdAt: new Date('2024-01-15'),
  },
];

// === ACTIVITIES (typical for each crop) ===
const createActivity = (
  id: string,
  cropId: string,
  type: ActivityType,
  startDate: Date,
  endDate: Date,
  description: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW',
): Activity => ({
  id,
  cropId,
  type,
  startDate,
  endDate,
  status: 'PLANNED' as ActivityStatus,
  description,
  riskScore: riskLevel === 'LOW' ? 20 : riskLevel === 'MEDIUM' ? 50 : 80,
  riskLevel,
  riskReason: undefined,
  createdAt: new Date(),
});

export const mockActivities: Activity[] = [
  // WHEAT (crop-001) - Nov to Apr
  createActivity(
    'act-001',
    'crop-001',
    'SOW',
    generateDate(11, 15),
    generateDate(11, 20),
    'Sow wheat seeds',
    'LOW'
  ),
  createActivity(
    'act-002',
    'crop-001',
    'IRRIGATE',
    generateDate(12, 15),
    generateDate(12, 16),
    'First irrigation cycle',
    'MEDIUM'
  ),
  createActivity(
    'act-003',
    'crop-001',
    'FERTILIZE',
    generateDate(12, 20),
    generateDate(12, 21),
    'Apply nitrogen fertilizer',
    'LOW'
  ),
  createActivity(
    'act-004',
    'crop-001',
    'IRRIGATE',
    generateDate(1, 15),
    generateDate(1, 16),
    'Second irrigation cycle',
    'MEDIUM'
  ),
  createActivity(
    'act-005',
    'crop-001',
    'SPRAY',
    generateDate(2, 1),
    generateDate(2, 2),
    'Pest control spray',
    'HIGH'
  ),
  createActivity(
    'act-006',
    'crop-001',
    'HARVEST',
    generateDate(4, 10),
    generateDate(4, 15),
    'Harvest wheat',
    'MEDIUM'
  ),

  // RICE (crop-002) - Jun to Oct
  createActivity(
    'act-007',
    'crop-002',
    'SOW',
    generateDate(6, 1),
    generateDate(6, 5),
    'Prepare nursery and sow rice',
    'MEDIUM'
  ),
  createActivity(
    'act-008',
    'crop-002',
    'TRANSPLANT',
    generateDate(7, 1),
    generateDate(7, 10),
    'Transplant rice seedlings',
    'HIGH'
  ),
  createActivity(
    'act-009',
    'crop-002',
    'IRRIGATE',
    generateDate(7, 15),
    generateDate(7, 16),
    'Maintain standing water',
    'HIGH'
  ),
  createActivity(
    'act-010',
    'crop-002',
    'FERTILIZE',
    generateDate(8, 1),
    generateDate(8, 2),
    'Apply topdressing fertilizer',
    'LOW'
  ),
  createActivity(
    'act-011',
    'crop-002',
    'SPRAY',
    generateDate(8, 20),
    generateDate(8, 21),
    'Disease management spray',
    'MEDIUM'
  ),
  createActivity(
    'act-012',
    'crop-002',
    'HARVEST',
    generateDate(10, 20),
    generateDate(10, 31),
    'Harvest rice',
    'HIGH'
  ),

  // TOMATO (crop-003) - Jul to Nov
  createActivity(
    'act-013',
    'crop-003',
    'SOW',
    generateDate(7, 1),
    generateDate(7, 5),
    'Sow tomato seeds',
    'LOW'
  ),
  createActivity(
    'act-014',
    'crop-003',
    'TRANSPLANT',
    generateDate(8, 1),
    generateDate(8, 10),
    'Transplant tomato seedlings',
    'LOW'
  ),
  createActivity(
    'act-015',
    'crop-003',
    'IRRIGATE',
    generateDate(8, 15),
    generateDate(8, 16),
    'Regular irrigation schedule',
    'LOW'
  ),
  createActivity(
    'act-016',
    'crop-003',
    'SPRAY',
    generateDate(9, 1),
    generateDate(9, 2),
    'Pest and disease management',
    'HIGH'
  ),
  createActivity(
    'act-017',
    'crop-003',
    'FERTILIZE',
    generateDate(9, 10),
    generateDate(9, 11),
    'Apply balanced fertilizer',
    'LOW'
  ),
  createActivity(
    'act-018',
    'crop-003',
    'SPRAY',
    generateDate(10, 1),
    generateDate(10, 2),
    'Final spray round',
    'MEDIUM'
  ),
  createActivity(
    'act-019',
    'crop-003',
    'HARVEST',
    generateDate(10, 15),
    generateDate(11, 30),
    'Harvest ripe tomatoes',
    'LOW'
  ),

  // MUSTARD (crop-004) - Oct to Mar
  createActivity(
    'act-020',
    'crop-004',
    'SOW',
    generateDate(10, 1),
    generateDate(10, 10),
    'Sow mustard seeds',
    'MEDIUM'
  ),
  createActivity(
    'act-021',
    'crop-004',
    'IRRIGATE',
    generateDate(11, 15),
    generateDate(11, 16),
    'First irrigation',
    'LOW'
  ),
  createActivity(
    'act-022',
    'crop-004',
    'FERTILIZE',
    generateDate(11, 20),
    generateDate(11, 21),
    'Apply nitrogen',
    'LOW'
  ),
  createActivity(
    'act-023',
    'crop-004',
    'IRRIGATE',
    generateDate(1, 10),
    generateDate(1, 11),
    'Second irrigation',
    'MEDIUM'
  ),
  createActivity(
    'act-024',
    'crop-004',
    'SPRAY',
    generateDate(2, 1),
    generateDate(2, 2),
    'Pest management spray',
    'HIGH'
  ),
  createActivity(
    'act-025',
    'crop-004',
    'HARVEST',
    generateDate(3, 1),
    generateDate(3, 15),
    'Harvest mustard',
    'MEDIUM'
  ),
];

// === MOCK WEATHER DATA ===
export const mockWeatherData: WeatherData[] = [
  {
    date: new Date(2024, 11, 16),
    tempC: 15,
    tempRounded: 15,
    windKph: 12,
    humidity: 45,
    precipitationProbability: 0.05,
    condition: 'Clear',
    conditionDescription: 'clear sky',
    timestamp: new Date(),
  },
  {
    date: new Date(2024, 11, 17),
    tempC: 14,
    tempRounded: 14,
    windKph: 18,
    humidity: 65,
    precipitationProbability: 0.45,
    condition: 'Rain',
    conditionDescription: 'light rain',
    timestamp: new Date(),
  },
  {
    date: new Date(2024, 11, 18),
    tempC: 13,
    tempRounded: 13,
    windKph: 25,
    humidity: 80,
    precipitationProbability: 0.85,
    condition: 'Rain',
    conditionDescription: 'moderate rain',
    timestamp: new Date(),
  },
  {
    date: new Date(2024, 11, 19),
    tempC: 16,
    tempRounded: 16,
    windKph: 15,
    humidity: 55,
    precipitationProbability: 0.2,
    condition: 'Clouds',
    conditionDescription: 'scattered clouds',
    timestamp: new Date(),
  },
  {
    date: new Date(2024, 11, 20),
    tempC: 18,
    tempRounded: 18,
    windKph: 10,
    humidity: 40,
    precipitationProbability: 0.05,
    condition: 'Clear',
    conditionDescription: 'clear sky',
    timestamp: new Date(),
  },
];
