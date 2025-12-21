
import { Service, Provider, Appointment, User } from './types';

export const MOCK_SERVICES: Service[] = [
  { 
    id: '1', 
    name: 'Dental Care', 
    description: 'Professional dental hygiene and cavity check-ups.', 
    duration: 30, 
    price: 0, 
    icon: '🦷',
    location: "Doctor's Office",
    type: 'Free',
    providers: ['Dr. James Miller', 'Asst. Sarah']
  },
  { 
    id: '2', 
    name: 'Tennis Court', 
    description: 'Reserve a professional grass court for up to 4 players.', 
    duration: 60, 
    price: 25, 
    icon: '🎾',
    location: 'Central Tennis Club',
    type: 'Paid',
    providers: ['Court R1', 'Court R2']
  },
  { 
    id: '3', 
    name: 'General Consultation', 
    description: 'Standard health check-up and medical advice.', 
    duration: 30, 
    price: 50, 
    icon: '🩺',
    location: 'Main Medical Plaza',
    type: 'Paid',
    providers: ['Dr. Sarah Wilson']
  },
  { 
    id: '4', 
    name: 'Yoga Studio', 
    description: 'Guided vinyasa flow session for all levels.', 
    duration: 45, 
    price: 0, 
    icon: '🧘',
    location: 'Wellness Studio, Room 12',
    type: 'Free',
    providers: ['Instructor Elena']
  },
];

export const MOCK_PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Dr. Sarah Wilson', specialty: 'General Physician', avatar: 'https://picsum.photos/seed/sarah/100', availability: ['Mon', 'Wed', 'Fri'] },
  { id: 'p2', name: 'Dr. James Miller', specialty: 'Dentist', avatar: 'https://picsum.photos/seed/james/100', availability: ['Tue', 'Thu', 'Sat'] },
  { id: 'p3', name: 'Dr. Elena Rossi', specialty: 'Psychologist', avatar: 'https://picsum.photos/seed/elena/100', availability: ['Mon', 'Tue', 'Wed', 'Thu'] },
  { id: 'p4', name: 'Dr. Michael Chen', specialty: 'Physiotherapist', avatar: 'https://picsum.photos/seed/michael/100', availability: ['Wed', 'Thu', 'Fri', 'Sat'] },
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  role: 'USER',
  avatar: 'https://picsum.photos/seed/alex/100'
};

export const MOCK_ADMIN: User = {
  id: 'a1',
  name: 'Admin Master',
  email: 'admin@aarkashan.com',
  role: 'ADMIN',
  avatar: 'https://picsum.photos/seed/admin/100'
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt1',
    userId: 'u1',
    userName: 'Alex Johnson',
    serviceId: '1',
    serviceName: 'Dental Care',
    providerId: 'p2',
    providerName: 'Dr. James Miller',
    date: '2024-06-15',
    timeSlot: '10:30 AM',
    status: 'CONFIRMED',
    venue: "Doctor's Office"
  },
  {
    id: 'apt2',
    userId: 'u1',
    userName: 'Alex Johnson',
    serviceId: '2',
    serviceName: 'Tennis Court',
    providerId: 'p1',
    providerName: 'Central Tennis Club',
    date: '2024-06-10',
    timeSlot: '02:00 PM',
    status: 'COMPLETED',
    venue: 'Tennis Court 1'
  }
];

export const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
];
