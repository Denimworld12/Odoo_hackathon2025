
export type Role = 'USER' | 'ADMIN' | 'ORGANIZER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  icon: string;
  location: string;
  type: 'Free' | 'Paid';
  providers: string[]; // List of names for the card display
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  availability: string[]; // ['Mon', 'Tue', ...]
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  date: string; // ISO string
  timeSlot: string;
  status: AppointmentStatus;
  venue: string;
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
