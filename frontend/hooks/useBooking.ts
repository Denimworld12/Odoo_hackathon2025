import { useState, useEffect, useCallback, useRef } from 'react';

interface BookingSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  remaining_capacity: number;
  total_capacity: number;
  resource_id: string | null;
  resource_name: string | null;
}

interface Reservation {
  id: string;
  appointment_type_id: string;
  resource_id: string;
  start_time: string;
  end_time: string;
  expires_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const RESERVATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const useBooking = (appointmentTypeId: string) => {
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Check for existing active reservation on mount
  useEffect(() => {
    const checkActiveReservation = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      try {
        const response = await fetch(
          `${API_URL}/api/reservations/active/${userData.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          }
        );
        
        const data = await response.json();
        if (data.success && data.has_active_reservation) {
          setCurrentReservation(data.reservation);
          setRemainingTime(data.remaining_seconds);
          startCountdown(data.remaining_seconds);
        }
      } catch (err) {
        console.error('Error checking active reservation:', err);
      }
    };

    checkActiveReservation();
  }, [appointmentTypeId]);

  const startCountdown = (seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setRemainingTime(seconds);
    countdownRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleReservationExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleReservationExpired = () => {
    setCurrentReservation(null);
    setError('Reservation expired. Please select a new time slot.');
  };

  const fetchAvailableSlots = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/api/reservations/available/${appointmentTypeId}/${date}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.slots);
      } else {
        setError(data.message || 'Failed to fetch slots');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [appointmentTypeId]);

  const reserveSlot = useCallback(async (slot: BookingSlot) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('Please login to make a reservation');
      return null;
    }
    
    const userData = JSON.parse(storedUser);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/reservations/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          appointment_type_id: appointmentTypeId,
          resource_id: slot.resource_id,
          customer_id: userData.id,
          start_time: slot.start_time,
          end_time: slot.end_time
        })
      });

      const data = await response.json();
      if (data.success) {
        const reservation: Reservation = {
          id: data.reservation.id,
          appointment_type_id: appointmentTypeId,
          resource_id: slot.resource_id || '',
          start_time: slot.start_time,
          end_time: slot.end_time,
          expires_at: data.expires_at
        };
        
        setCurrentReservation(reservation);
        
        // Start 5-minute countdown
        startCountdown(data.timeout_minutes * 60);
        
        // Update slot availability
        setAvailableSlots(prev => 
          prev.map(s => 
            s.start_time === slot.start_time && s.end_time === slot.end_time
              ? { ...s, remaining_capacity: data.remaining_capacity }
              : s
          )
        );
        
        return reservation;
      } else {
        setError(data.message || 'Failed to reserve slot');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reserve slot');
      return null;
    } finally {
      setLoading(false);
    }
  }, [appointmentTypeId]);

  const confirmBooking = useCallback(async (
    questionResponses: Array<{ question_id: string; answer_value: string }> = [],
    assignedUserId?: string,
    paymentId?: string
  ) => {
    if (!currentReservation) {
      setError('No active reservation');
      return null;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('Please login to confirm booking');
      return null;
    }
    
    const userData = JSON.parse(storedUser);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/reservations/${currentReservation.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          customer_id: userData.id,
          assigned_user_id: assignedUserId,
          question_responses: questionResponses,
          payment_id: paymentId
        })
      });

      const data = await response.json();
      if (data.success) {
        // Clear timers
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        setCurrentReservation(null);
        setRemainingTime(0);
        return data.booking;
      } else {
        setError(data.message || 'Failed to confirm booking');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentReservation]);

  const cancelReservation = useCallback(async () => {
    if (!currentReservation) {
      return false;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return false;
    
    const userData = JSON.parse(storedUser);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/reservations/${currentReservation.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ customer_id: userData.id })
        }
      );

      const data = await response.json();
      if (data.success) {
        // Clear timers
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        setCurrentReservation(null);
        setRemainingTime(0);
        return true;
      } else {
        setError(data.message || 'Failed to cancel reservation');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentReservation]);

  const extendReservation = useCallback(async () => {
    if (!currentReservation) {
      return false;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return false;
    
    const userData = JSON.parse(storedUser);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/reservations/${currentReservation.id}/extend`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ customer_id: userData.id })
        }
      );

      const data = await response.json();
      if (data.success) {
        setCurrentReservation(prev => prev ? { ...prev, expires_at: data.new_expires_at } : null);
        startCountdown(5 * 60); // Reset to 5 minutes
        return true;
      } else {
        setError(data.message || 'Failed to extend reservation');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend reservation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentReservation]);

  // Format remaining time as MM:SS
  const formatRemainingTime = useCallback(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingTime]);

  return {
    availableSlots,
    currentReservation,
    remainingTime,
    formatRemainingTime,
    loading,
    error,
    fetchAvailableSlots,
    reserveSlot,
    confirmBooking,
    cancelReservation,
    extendReservation
  };
};
