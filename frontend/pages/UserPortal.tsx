import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment, Service, Provider } from '../types';
import { 
  Calendar, Clock, MapPin, User as UserIcon, LogOut, LayoutDashboard, 
  Settings, CheckCircle2, ChevronRight, Search, PlusCircle, X, Check, Filter, Loader2, AlertCircle, Timer,
  Download, Mail
} from 'lucide-react';
import { MOCK_SERVICES, MOCK_PROVIDERS, MOCK_APPOINTMENTS, TIME_SLOTS } from '../constants';
import { useBooking } from '../hooks/useBooking';

interface UserPortalProps {
  user: User;
  onLogout: () => void;
}

const API_BASE = "http://localhost:5000/api";

// Interface for backend booking data
interface BackendBooking {
  id: string;
  appointment_type_id: string;
  customer_id: string;
  resource_id: string | null;
  assigned_user_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  created_at: string;
  service_name: string | null;
  location: string | null;
  duration_minutes: number | null;
  booking_fee: string | null;
  provider_name: string | null;
}

const UserPortal: React.FC<UserPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'BOOKING' | 'PROFILE'>('DASHBOARD');
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState('2024-06-25');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Free' | 'Paid'>('All');

  // Bookings from database
  const [dbBookings, setDbBookings] = useState<Appointment[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  // Appointment types (services) from database for Dashboard
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Use booking hook for reservation system
  const {
    availableSlots,
    currentReservation,
    remainingTime,
    formatRemainingTime,
    loading: bookingLoading,
    error: bookingError,
    fetchAvailableSlots,
    reserveSlot,
    confirmBooking,
    cancelReservation
  } = useBooking(selectedService?.id || '');

  // Selected slot from available slots
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  // Payment tracking
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  
  // Booking details modal
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Store confirmed booking ID for PDF/Email after confirmation
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  // Fetch all appointment types for Dashboard
  useEffect(() => {
    const fetchAllAppointments = async () => {
      try {
        setIsLoadingServices(true);
        const res = await fetch(`${API_BASE}/appointments/all-appointments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await res.json();
        
        // Convert backend appointment types to frontend Service format
        const convertedServices: Service[] = (data.appointments || []).map((apt: any) => ({
          id: apt.id,
          name: apt.title,
          description: apt.description || '',
          duration: apt.duration_minutes,
          price: Number(apt.booking_fee || 0),
          icon: '📅',
          location: apt.location || '',
          type: Number(apt.booking_fee) > 0 ? 'Paid' : 'Free',
          providers: [],
          published: apt.is_published
        }));

        setDbServices(convertedServices);
      } catch (err) {
        console.error('Error fetching appointment types:', err);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchAllAppointments();
  }, []);

  // Fetch user's bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoadingBookings(true);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setIsLoadingBookings(false);
          return;
        }
        
        const userData = JSON.parse(storedUser);
        if (!userData?.id) {
          console.log('No user ID found');
          setIsLoadingBookings(false);
          return;
        }

        const res = await fetch(`${API_BASE}/bookings/customer/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}` 
          }
        });

        // Handle non-OK responses gracefully
        if (!res.ok) {
          console.log('Bookings fetch returned:', res.status);
          // Don't throw, just set empty bookings
          setDbBookings([]);
          setIsLoadingBookings(false);
          return;
        }

        const data = await res.json();
        
        // Convert backend bookings to frontend Appointment format
        const convertedBookings: Appointment[] = (data.bookings || []).map((b: BackendBooking) => {
          const startDate = new Date(b.start_time);
          const timeSlot = startDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          const dateStr = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return {
            id: b.id,
            serviceName: b.service_name || 'Unknown Service',
            providerName: b.provider_name || 'Unassigned',
            date: dateStr,
            timeSlot: timeSlot,
            status: (b.status?.toUpperCase() || 'PENDING') as Appointment['status'],
            createdAt: b.created_at,
            paymentStatus: (b.payment_status?.toUpperCase() || 'UNPAID') as 'PAID' | 'UNPAID',
            location: b.location || '',
            duration: b.duration_minutes || 0,
            price: Number(b.booking_fee) || 0
          };
        });

        setDbBookings(convertedBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();
  }, []);

  // Combine MOCK_SERVICES with database services for filtering
  const allServices = useMemo(() => {
    return [...MOCK_SERVICES, ...dbServices];
  }, [dbServices]);

  const filteredServices = useMemo(() => {
    return allServices.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || service.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [allServices, searchQuery, typeFilter]);

  const startBooking = (service?: Service) => {
    if (service) setSelectedService(service);
    setBookingStep(service ? 2 : 1);
    setActiveTab('BOOKING');
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedService?.id && selectedDate && bookingStep === 3) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedService?.id, selectedDate, bookingStep, fetchAvailableSlots]);

  // Handle reservation expiry - redirect to dashboard
  useEffect(() => {
    if (remainingTime === 0 && currentReservation === null && bookingStep > 3 && bookingStep < 6) {
      resetBooking();
    }
  }, [remainingTime, currentReservation, bookingStep]);

  const handleSelectSlot = async (slot: any) => {
    setSelectedSlot(slot);
    setSelectedTime(`${new Date(slot.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
    
    // Reserve the slot immediately
    const reservation = await reserveSlot(slot);
    if (reservation) {
      setBookingStep(4); // Move to questions step after successful reservation
    }
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    const price = selectedService?.price || 0;
    
    if (price <= 0) {
      // Free service - confirm directly
      await handleConfirmBooking();
      return;
    }

    // Load Razorpay script if not already loaded
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;

    // Get Razorpay key - for Vite use import.meta.env, hardcode for reliability
    const razorpayKey = 'rzp_test_RKzZtAQI0tPHeC';
    
    const options = {
      key: razorpayKey,
      amount: price * 100, // Amount in paise
      currency: 'INR',
      name: 'Aarakshan',
      description: `Booking for ${selectedService?.name}`,
      handler: async function (response: any) {
        // Payment successful - confirm booking with payment details
        setLastPaymentId(response.razorpay_payment_id);
        await handleConfirmBooking(response.razorpay_payment_id);
      },
      prefill: {
        name: userData?.full_name || userData?.name || '',
        email: userData?.email || '',
      },
      theme: {
        color: '#4F46E5'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
        }
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  const handleConfirmBooking = async (paymentId?: string) => {
    // TODO: Collect question responses from form
    const questionResponses: Array<{ question_id: string; answer_value: string }> = [];
    
    // Only pass assigned_user_id if it's a valid UUID (not mock data like "p1", "p2")
    const isValidUUID = selectedProvider?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedProvider.id);
    const assignedUserId = isValidUUID ? selectedProvider?.id : undefined;
    
    const booking = await confirmBooking(questionResponses, assignedUserId, paymentId);
    if (booking) {
      setConfirmedBookingId(booking.id); // Store the booking ID for PDF/Email
      setBookingConfirmed(true);
      setBookingStep(6);
    }
  };

  const handleCancelReservation = async () => {
    await cancelReservation();
    setSelectedSlot(null);
    setSelectedTime('');
    setBookingStep(3);
  };

  const resetBooking = () => {
    setBookingStep(1);
    setSelectedService(null);
    setSelectedProvider(null);
    setSelectedTime('');
    setSelectedSlot(null);
    setBookingConfirmed(false);
    setLastPaymentId(null);
    setConfirmedBookingId(null);
    setEmailSent(false);
    setActiveTab('DASHBOARD');
    if (currentReservation) {
      cancelReservation();
    }
  };

  // Download PDF
  const handleDownloadPDF = async (bookingId: string) => {
    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`${API_BASE}/bookings/pdf/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Email booking report
  const handleEmailReport = async (bookingId: string) => {
    setIsSendingEmail(true);
    setEmailSent(false);
    try {
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      
      const response = await fetch(`${API_BASE}/bookings/email/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ email: userData?.email })
      });

      const data = await response.json();
      if (data.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        alert(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Cancel a booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    setIsCancelling(bookingId);
    try {
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      
      const res = await fetch(`${API_BASE}/bookings/cancel/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ customer_id: userData?.id })
      });

      const data = await res.json();
      if (data.success) {
        // Update the booking in state
        setDbBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b
        ));
      } else {
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
    } finally {
      setIsCancelling(null);
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
            <Calendar className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 tracking-tight">
            Aarakshan
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:text-indigo-600 hover:bg-indigo-50 ${
              activeTab === 'DASHBOARD' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : ''
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('BOOKING')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:text-indigo-600 hover:bg-indigo-50 ${
              activeTab === 'BOOKING' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : ''
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book</span>
          </button>
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:text-indigo-600 hover:bg-indigo-50 ${
              activeTab === 'PROFILE' ? 'text-indigo-600 bg-indigo-50 shadow-sm' : ''
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Appointments</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* App background frame */}
      <div className="min-h-screen bg-slate-50">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Search and Type Filter Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full max-w-lg">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search appointments..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex flex-col w-full md:w-40">
                    <span className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-0.5 tracking-wider">Type</span>
                    <div className="relative">
                      <Filter className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                      <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-600 appearance-none text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="All">All Types</option>
                        <option value="Free">Free</option>
                        <option value="Paid">Paid</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2.5 text-[10px] text-slate-400">▾</span>
                    </div>
                  </div>
                </div>
              </div>

              <section>
                <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Appointments</h2>
                <p className="text-xs text-slate-500 mb-5">Browse available services and book a time that works best for you.</p>
                
                {isLoadingServices ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="ml-2 text-sm text-slate-500">Loading appointments...</span>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                  {filteredServices.map((service) => (
                    <div 
                      key={service.id} 
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col"
                    >
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Card Title */}
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {service.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            service.type === 'Free' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {service.type}
                          </span>
                        </div>

                        {/* Card Content Split */}
                        <div className="flex flex-col gap-3">
                          {/* Small visual icon card */}
                          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">
                            <span>{service.icon}</span>
                          </div>

                          {/* Metadata Area */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                              <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <div className="flex flex-col">
                                  <span className="font-semibold leading-tight">{service.duration} mins</span>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Duration</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                <div className="flex flex-col">
                                  <span className="font-semibold leading-tight">
                                    {service.price > 0 ? `₹${service.price}` : 'Free'}
                                  </span>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Fee</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Location</h4>
                              <div className="flex items-center gap-2 text-slate-600 font-medium px-1 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="line-clamp-1">{service.location || 'Not specified'}</span>
                              </div>
                            </div>

                            {service.providers && service.providers.length > 0 && (
                              <div>
                                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Available Specialists</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {service.providers.map((p, i) => (
                                    <div 
                                      key={i} 
                                      className="inline-flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 text-[10px]"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      {p}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Message Area */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Overview</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                            {service.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2">
                        <button 
                          onClick={() => startBooking(service)}
                          className="bg-slate-900 text-white w-full py-2.5 rounded-xl font-black text-xs hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
                        >
                          Book Appointment
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredServices.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <div className="text-4xl mb-3 opacity-20">🔍</div>
                      <h3 className="text-sm font-bold text-slate-400">No appointments found matching your criteria.</h3>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting the search or filters.</p>
                    </div>
                  )}
                </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'BOOKING' && (
            <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              {/* Steps Progress */}
              {!bookingConfirmed && (
                <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex justify-between mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          bookingStep === s ? 'bg-indigo-600 text-white ring-2 ring-indigo-100 shadow-sm' : 
                          bookingStep > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {bookingStep > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Step {s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500" 
                      style={{ width: `${(bookingStep - 1) * 25}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5 sm:p-8 space-y-4">
                {/* Step 1: Service */}
                {bookingStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Select a Service</h2>
                      <p className="text-xs text-slate-500">Choose what you would like to book today.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MOCK_SERVICES.map((s) => (
                        <button 
                          key={s.id}
                          onClick={() => { setSelectedService(s); setBookingStep(2); }}
                          className={`p-4 text-left rounded-xl border transition-all bg-slate-50/50 hover:bg-slate-50 flex flex-col gap-2 ${
                            selectedService?.id === s.id ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-2xl">{s.icon}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold">
                              {s.duration} min
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm line-clamp-1">{s.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {s.duration} mins • {s.price > 0 ? `₹${s.price}` : 'Free'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Provider */}
                Step 2: Provider
                {bookingStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Choose Your Specialist</h2>
                      <p className="text-xs text-slate-500">Pick the provider you are most comfortable with.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MOCK_PROVIDERS.map((p) => (
                        <button 
                          key={p.id}
                          onClick={() => { setSelectedProvider(p); setBookingStep(3); }}
                          className={`p-4 flex items-center gap-3 text-left rounded-xl border transition-all bg-slate-50/40 hover:bg-slate-50 ${
                            selectedProvider?.id === p.id ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.specialty}</div>
                            <div className="text-[9px] text-indigo-600 font-medium mt-0.5">
                              Available: {p.availability.join(', ')}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between">
                      <button onClick={() => setBookingStep(1)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Date & Time */}
                {bookingStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Select Date & Time</h2>
                      <p className="text-xs text-slate-500">Pick a convenient date and an available slot.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-600">
                              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex gap-1">
                              <button className="p-1 hover:bg-white rounded text-slate-400 text-xs border border-transparent hover:border-slate-200">{'<'}</button>
                              <button className="p-1 hover:bg-white rounded text-slate-400 text-xs border border-transparent hover:border-slate-200">{'>'}</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 mb-1">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {Array.from({length: 31}, (_, i) => i + 1).map(d => {
                              const today = new Date();
                              const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                              const isSelected = selectedDate === dateStr;
                              const isPast = new Date(dateStr) < new Date(today.toDateString());
                              return (
                                <button 
                                  key={d} 
                                  disabled={isPast}
                                  onClick={() => setSelectedDate(dateStr)}
                                  className={`py-1.5 text-xs rounded-md transition-all ${
                                    isSelected ? 'bg-indigo-600 text-white shadow-sm' : 
                                    isPast ? 'text-slate-300 cursor-not-allowed' : 
                                    'hover:bg-indigo-50 text-slate-700'
                                  }`}
                                >
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold mb-3 text-xs uppercase tracking-wide text-slate-600">Available Slots</h3>
                        
                        {bookingLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            <span className="ml-2 text-sm text-slate-500">Loading slots...</span>
                          </div>
                        ) : bookingError ? (
                          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-2 items-start">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">{bookingError}</p>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-500">No slots available for this date</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                            {availableSlots.map((slot, idx) => {
                              const startTime = new Date(slot.start_time);
                              const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                              const isSelected = selectedSlot?.start_time === slot.start_time;
                              return (
                                <button 
                                  key={idx}
                                  disabled={!slot.available || bookingLoading}
                                  onClick={() => handleSelectSlot(slot)}
                                  className={`py-2 px-2 rounded-lg border text-[11px] font-bold transition-all flex flex-col ${
                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 
                                    !slot.available ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed' :
                                    'border-slate-100 hover:border-indigo-200 text-slate-600 bg-white'
                                  }`}
                                >
                                  <div>{timeStr}</div>
                                  {slot.remaining_capacity !== undefined && (
                                    <div className={`text-[9px] mt-0.5 ${
                                      !slot.available ? 'text-slate-400' : 'text-green-600'
                                    }`}>
                                      {slot.available ? `${slot.remaining_capacity} spots left` : 'Full'}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <button onClick={() => setBookingStep(2)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Questions */}
                {bookingStep === 4 && (
                  <div className="space-y-4">
                    {/* Reservation Timer Banner */}
                    {currentReservation && (
                      <div className={`mb-3 p-3 rounded-xl flex items-center justify-between ${
                        remainingTime <= 60 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Timer className={`w-4 h-4 ${remainingTime <= 60 ? 'text-red-500' : 'text-amber-600'}`} />
                          <span className={`text-xs font-bold ${remainingTime <= 60 ? 'text-red-700' : 'text-amber-700'}`}>
                            Slot reserved for: <span className="font-black">{formatRemainingTime()}</span>
                          </span>
                        </div>
                        <button 
                          onClick={handleCancelReservation}
                          className="text-xs font-bold text-slate-500 hover:text-red-500"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <h2 className="text-xl font-bold mb-1">Details</h2>
                    <p className="text-xs text-slate-500 mb-3">Help us prepare for your visit.</p>
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Reason for Visit</label>
                        <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 text-sm resize-none" rows={2} placeholder="Briefly describe..." />
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Medical Allergies</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 text-sm" placeholder="N/A" />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <button onClick={handleCancelReservation} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">
                        Back
                      </button>
                      <button onClick={() => setBookingStep(5)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm">
                        Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Review */}
                {bookingStep === 5 && (
                  <div className="space-y-5">
                    {/* Reservation Timer Banner */}
                    {currentReservation && (
                      <div className={`p-3 rounded-xl flex items-center justify-between ${
                        remainingTime <= 60 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Timer className={`w-4 h-4 ${remainingTime <= 60 ? 'text-red-500' : 'text-amber-600'}`} />
                          <span className={`text-xs font-bold ${remainingTime <= 60 ? 'text-red-700' : 'text-amber-700'}`}>
                            Complete booking within: <span className="font-black">{formatRemainingTime()}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <h2 className="text-xl font-bold">Review & Confirm</h2>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Service</span>
                        <span className="font-bold text-slate-900">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Provider</span>
                        <span className="font-bold text-slate-900">{selectedProvider?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date</span>
                        <span className="font-bold text-slate-900">{selectedDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Time</span>
                        <span className="font-bold text-slate-900">{selectedTime}</span>
                      </div>
                      <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Total Price</span>
                        <span className="text-lg font-black text-indigo-600">
                          {(selectedService?.price || 0) > 0 ? `₹${selectedService?.price}` : 'Free'}
                        </span>
                      </div>
                    </div>
                    
                    {(selectedService?.price || 0) > 0 ? (
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3">
                        <AlertCircle className="text-amber-600 w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 font-medium">Payment of ₹{selectedService?.price} is required to confirm this booking.</p>
                      </div>
                    ) : (
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex gap-3">
                        <CheckCircle2 className="text-indigo-600 w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-800 font-medium">This is a free appointment. No payment required.</p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button onClick={() => setBookingStep(4)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">
                        Back
                      </button>
                      {(selectedService?.price || 0) > 0 ? (
                        <button 
                          onClick={handleRazorpayPayment} 
                          disabled={bookingLoading}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              💳 Pay ₹{selectedService?.price} with Razorpay
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleConfirmBooking()} 
                          disabled={bookingLoading}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md disabled:opacity-50 hover:bg-indigo-700"
                        >
                          {bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 6: Confirmation */}
                {bookingStep === 6 && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Booking Confirmed!</h2>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      Your appointment for <strong>{selectedService?.name}</strong> is scheduled on <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.
                    </p>
                    
                    {/* Payment Status */}
                    {lastPaymentId && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-xl max-w-sm mx-auto space-y-1.5">
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-bold">Payment Successful</span>
                        </div>
                        <p className="text-[10px] text-green-600">
                          Transaction ID: <span className="font-mono">{lastPaymentId}</span>
                        </p>
                        <p className="text-[10px] text-green-600">
                          Amount Paid: ₹{selectedService?.price}
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-slate-50 p-4 rounded-xl inline-block text-left w-full max-w-sm border border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-indigo-400 w-4 h-4" />
                        <span className="text-xs font-bold text-slate-700">{selectedDate} at {selectedTime}</span>
                      </div>
                      {selectedService?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="text-indigo-400 w-4 h-4" />
                          <span className="text-xs font-bold text-slate-700">{selectedService?.location}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 italic font-medium mt-1">*Check your email for full details.</div>
                    </div>
                    
                    {/* Download PDF & Email Report Buttons */}
                    {confirmedBookingId && (
                      <div className="flex gap-3 justify-center max-w-sm mx-auto">
                        <button 
                          onClick={() => handleDownloadPDF(confirmedBookingId)}
                          disabled={isDownloadingPDF}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 disabled:opacity-50"
                        >
                          {isDownloadingPDF ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
                        </button>
                        <button 
                          onClick={() => handleEmailReport(confirmedBookingId)}
                          disabled={isSendingEmail}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 ${
                            emailSent 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                        >
                          {isSendingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : emailSent ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          {isSendingEmail ? 'Sending...' : emailSent ? 'Email Sent!' : 'Email Report'}
                        </button>
                      </div>
                    )}

                    <div className="pt-3 flex flex-col sm:flex-row justify-center gap-3">
                      <button 
                        onClick={() => { resetBooking(); setActiveTab('PROFILE'); }} 
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm"
                      >
                        Go to My Appointments
                      </button>
                      <button 
                        onClick={resetBooking} 
                        className="border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 bg-white"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'PROFILE' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-600" />
                <div className="px-6 pb-6 -mt-10 flex flex-col md:flex-row items-end gap-5">
                  <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl border-4 border-white shadow-md object-cover" />
                  <div className="flex-1 pb-1">
                    <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                  </div>
                  <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-xs mb-1 hover:bg-indigo-700 shadow-sm">
                    Edit Profile
                  </button>
                </div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black tracking-tight">Booking History</h2>
                  <div className="flex gap-1.5">
                    <button className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full uppercase tracking-widest shadow-sm">All</button>
                    <button className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 uppercase tracking-widest">Upcoming</button>
                  </div>
                </div>
                
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="ml-2 text-sm text-slate-500">Loading bookings...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show only database bookings, sorted by created_at descending (newest first) */}
                    {dbBookings
                      .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                      })
                      .map((apt) => (
                      <div 
                        key={apt.id} 
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{apt.serviceName}</h4>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                              apt.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              apt.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">with {apt.providerName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {apt.date}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {apt.timeSlot}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                            <button 
                              onClick={() => handleCancelBooking(apt.id)}
                              disabled={isCancelling === apt.id}
                              className="text-red-500 font-bold text-[10px] px-3 py-1.5 hover:bg-red-50 rounded-lg uppercase tracking-wider disabled:opacity-50"
                            >
                              {isCancelling === apt.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedBookingDetails(apt)}
                            className="bg-slate-50 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-slate-100 uppercase tracking-wider border border-slate-100"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {dbBookings.length === 0 && (
                      <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="text-4xl mb-3 opacity-20">📅</div>
                        <h3 className="text-sm font-bold text-slate-400">No bookings yet</h3>
                        <p className="text-xs text-slate-400 mt-1">Your booking history will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-100 px-6 py-2 flex justify-around items-center z-50 shadow-[0_-4px_12px_rgba(15,23,42,0.04)]">
          <button 
            onClick={() => setActiveTab('DASHBOARD')} 
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('BOOKING')} 
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'BOOKING' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase">Book</span>
          </button>
          <button 
            onClick={() => setActiveTab('PROFILE')} 
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'PROFILE' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase">Profile</span>
          </button>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBookingDetails(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black text-slate-900">Booking Details</h3>
              <button onClick={() => setSelectedBookingDetails(null)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Service</span>
                  <span className="text-sm font-bold text-slate-900">{selectedBookingDetails.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Provider</span>
                  <span className="text-sm font-bold text-slate-900">{selectedBookingDetails.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Date</span>
                  <span className="text-sm font-bold text-slate-900">{selectedBookingDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Time</span>
                  <span className="text-sm font-bold text-slate-900">{selectedBookingDetails.timeSlot}</span>
                </div>
                {selectedBookingDetails.duration && selectedBookingDetails.duration > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Duration</span>
                    <span className="text-sm font-bold text-slate-900">{selectedBookingDetails.duration} mins</span>
                  </div>
                )}
                {selectedBookingDetails.location && (
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Location</span>
                    <span className="text-sm font-bold text-slate-900">{selectedBookingDetails.location}</span>
                  </div>
                )}
                {selectedBookingDetails.price !== undefined && selectedBookingDetails.price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Price</span>
                    <span className="text-sm font-bold text-indigo-600">₹{selectedBookingDetails.price}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                    selectedBookingDetails.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    selectedBookingDetails.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                    selectedBookingDetails.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {selectedBookingDetails.status}
                  </span>
                </div>
                {selectedBookingDetails.paymentStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Payment</span>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      selectedBookingDetails.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {selectedBookingDetails.paymentStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* PDF & Email Actions */}
              {!selectedBookingDetails.id.startsWith('apt') && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadPDF(selectedBookingDetails.id)}
                    disabled={isDownloadingPDF}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 disabled:opacity-50"
                  >
                    {isDownloadingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => handleEmailReport(selectedBookingDetails.id)}
                    disabled={isSendingEmail}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 ${
                      emailSent 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : emailSent ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {isSendingEmail ? 'Sending...' : emailSent ? 'Email Sent!' : 'Email Report'}
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {(selectedBookingDetails.status === 'PENDING' || selectedBookingDetails.status === 'CONFIRMED') && !selectedBookingDetails.id.startsWith('apt') && (
                  <button 
                    onClick={() => {
                      handleCancelBooking(selectedBookingDetails.id);
                      setSelectedBookingDetails(null);
                    }}
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100"
                  >
                    Cancel Booking
                  </button>
                )}
                <button 
                  onClick={() => setSelectedBookingDetails(null)}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserPortal;
