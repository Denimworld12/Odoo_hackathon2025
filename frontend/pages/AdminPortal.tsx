import React, { useState, useCallback, useEffect } from 'react';
import { User, Service, Provider, Appointment, Question, TimeSlotRange } from '../types';
import { 
  Calendar, Clock, Settings, LogOut, Search, PlusCircle, Edit3, Trash2, 
  Check, X, Eye, Share2, Save, ChevronRight, BarChart3, Users, EyeOff, 
  Upload, Image as ImageIcon, ArrowRight, Copy, CheckCircle2, Loader2
} from 'lucide-react';
import { MOCK_PROVIDERS, MOCK_APPOINTMENTS } from '../constants';

interface OrganiserPortalProps {
  user: User;
  onLogout: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const QUESTION_TYPES: Array<{value: Question['type'], label: string}> = [
  { value: 'text', label: 'Single line text' },
  { value: 'textarea', label: 'Multi-line text' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'radio', label: 'Radio (One Answer)' },
  { value: 'checkbox', label: 'Checkboxes (Multiple Answers)' },
  { value: 'number', label: 'Number' },
];

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface TimeSlot {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
}

interface ServiceForm extends Partial<Service> {
  bookType?: 'USER' | 'RESOURCE';
  assignmentType?: 'AUTO' | 'MANUAL';
  manageCapacity?: boolean;
  maxBookingsPerSlot?: number;
  slotCreation?: string;
  cancellationHours?: number;
  introductionMessage?: string;
  confirmationMessage?: string;
  picture?: string;
  workingHours?: Record<string, TimeSlot[]>;
}

const NavItemRoot: React.FC<{
  id: 'SERVICES' | 'BOOKINGS' | 'CALENDAR' | 'SETTINGS';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  activeTab: string;
  onClick: (id: 'SERVICES' | 'BOOKINGS' | 'CALENDAR' | 'SETTINGS') => void;
}> = ({ id, icon: Icon, label, activeTab, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all font-medium ${
      activeTab === id
        ? 'bg-slate-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)]'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className="w-4.5 h-4.5" />
    {label}
  </button>
);

const OrganiserPortal: React.FC<OrganiserPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'BOOKINGS' | 'CALENDAR' | 'SETTINGS'>('SERVICES');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingService, setIsEditingService] = useState(false);
  const [configTab, setConfigTab] = useState<'BASIC' | 'SCHEDULE' | 'QUESTIONS' | 'OPTIONS' | 'MESSAGES'>('BASIC');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareLinkVisible, setShareLinkVisible] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({ 
    type: 'text', 
    label: '',
    required: false,
    options: []
  } as const);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serviceForm, setServiceForm] = useState<ServiceForm>({});
  const [workingHours, setWorkingHours] = useState<Record<string, TimeSlot[]>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const API_BASE = "http://localhost:5000/api";

  // Fetch organizer's appointments on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsFetching(true);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        
        const userData = JSON.parse(storedUser);
        const res = await fetch(`${API_BASE}/appointments/organiser/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch services');
        }

        const data = await res.json();
        
        // Convert backend format to frontend Service format
        const dayNumberToName: Record<number, string> = {
          0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
          4: 'Thursday', 5: 'Friday', 6: 'Saturday'
        };

        const convertedServices: Service[] = (data.appointments || []).map((apt: any) => {
          // Convert schedules to workingHours format
          const workingHrs: Record<string, TimeSlot[]> = {};
          (apt.schedules || []).forEach((sch: any) => {
            const dayName = dayNumberToName[sch.day_of_week] || 'Monday';
            if (!workingHrs[dayName]) workingHrs[dayName] = [];
            workingHrs[dayName].push({
              id: sch.id,
              from: sch.start_time?.substring(0, 5) || '09:00',
              to: sch.end_time?.substring(0, 5) || '17:00',
              enabled: true
            });
          });

          // Convert questions
          const qs: Question[] = (apt.questions || []).map((q: any) => ({
            id: q.id,
            label: q.label,
            type: q.field_type?.toLowerCase() || 'text',
            required: q.is_mandatory,
            options: []
          }));

          return {
            id: apt.id,
            name: apt.title,
            description: apt.description || '',
            duration: apt.duration_minutes,
            price: Number(apt.booking_fee || 0),
            icon: '📅',
            location: apt.location || '',
            type: Number(apt.booking_fee) > 0 ? 'Paid' : 'Free',
            providers: [],
            published: apt.is_published,
            bookType: apt.target_type || 'USER',
            assignmentType: apt.assignment_type === 'AUTOMATIC' ? 'AUTO' : 'MANUAL',
            questions: qs,
            workingHours: workingHrs
          };
        });

        setServices(convertedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setIsFetching(false);
      }
    };

    fetchServices();
  }, []);

  const handleTabChange = useCallback((tab: 'SERVICES' | 'BOOKINGS' | 'CALENDAR' | 'SETTINGS') => {
    setActiveTab(tab);
  }, []);

  const handleConfigTabChange = useCallback((tab: 'BASIC' | 'SCHEDULE' | 'QUESTIONS' | 'OPTIONS' | 'MESSAGES') => {
    setConfigTab(tab);
  }, []);

  const NavItem: React.FC<{
    id: 'SERVICES' | 'BOOKINGS' | 'CALENDAR' | 'SETTINGS';
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all font-medium ${
        activeTab === id
          ? 'bg-slate-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)]'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-4.5 h-4.5" />
      {sidebarOpen && <span>{label}</span>}
    </button>
  );

  const handleTogglePublish = useCallback(async (serviceId: string) => {
    try {
      setIsLoading(true);
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const published = !service.published;
      const res = await fetch(`${API_BASE}/services/${serviceId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ published })
      });

      if (!res.ok) {
        throw new Error('Failed to update service status');
      }

      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, published } : s
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating service status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [services]);

  const handleDeleteService = useCallback(async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/appointments/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete service');
      }

      setServices(prev => prev.filter(s => s.id !== serviceId));
      if (selectedService?.id === serviceId) {
        setSelectedService(null);
        setIsEditingService(false);
      }
      alert('Service deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting service:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedService]);

  const handleEditService = useCallback((service: Service) => {
    setSelectedService(service);
    setServiceForm({
      ...service,
      bookType: service.bookType || 'USER',
      manageCapacity: service.manageCapacity || false,
      slotCreation: service.slotCreation || `${String(Math.floor(service.duration / 60)).padStart(2, '0')}:${String(service.duration % 60).padStart(2, '0')}`,
      cancellationHours: service.cancellationHours || 1,
      introductionMessage: service.introductionMessage || '',
      confirmationMessage: service.confirmationMessage || '',
      picture: service.picture,
      questions: service.questions || [],
      workingHours: service.workingHours || {}
    });
    setQuestions(service.questions || []);
    setWorkingHours(service.workingHours || {});
    setIsEditingService(true);
    setConfigTab('BASIC');
    setShareLinkVisible(false);
  }, []);

  const handleAddTimeSlot = useCallback((day: string) => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      from: '09:00',
      to: '17:00',
      enabled: true,
    };
    setWorkingHours(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newSlot],
    }));
  }, []);

  const handleRemoveTimeSlot = useCallback((day: string, slotId: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(s => s.id !== slotId),
    }));
  }, []);

  const handleAddQuestion = useCallback(() => {
    if (newQuestion.label) {
      const question: Question = {
        id: Date.now().toString(),
        label: newQuestion.label,
        type: newQuestion.type,
        required: newQuestion.required,
        options: newQuestion.options || [],
      };
      setQuestions(prev => [...prev, question]);
      setNewQuestion({ 
        type: 'text', 
        label: '',
        required: false, 
        options: [] 
      } as const);
    }
  }, [newQuestion]);

  const handleRemoveQuestion = useCallback((questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  const handleSaveService = useCallback(async () => {
    if (!serviceForm.name || serviceForm.duration === undefined) {
      alert("Service name and duration are required");
      return;
    }

    // Convert workingHours to schedules format for backend
    const dayToNumber: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const schedules: Array<{ day_of_week: number; start_time: string; end_time: string }> = [];
    if (workingHours && typeof workingHours === 'object') {
      Object.entries(workingHours).forEach(([day, slots]: [string, TimeSlot[]]) => {
        if (Array.isArray(slots)) {
          slots.forEach((slot: TimeSlot) => {
            if (slot.enabled) {
              schedules.push({
                day_of_week: dayToNumber[day] ?? 0,
                start_time: slot.from,
                end_time: slot.to
              });
            }
          });
        }
      });
    }

    // Convert questions to backend format
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'textarea': 'MULTI_LINE',
      'phone': 'PHONE',
      'radio': 'RADIO',
      'checkbox': 'CHECKBOX',
      'number': 'NUMBER'
    };
    const formattedQuestions = questions.map(q => ({
      label: q.label,
      field_type: typeMapping[q.type] || 'TEXT',
      is_mandatory: q.required
    }));

    const payload = {
      title: serviceForm.name,
      description: serviceForm.description || "",
      location: serviceForm.location || "",
      duration_minutes: serviceForm.duration,
      booking_fee: serviceForm.price || 0,
      manual_confirmation: serviceForm.manualConfirmation ?? false,
      is_published: serviceForm.published ?? false,
      target_type: serviceForm.bookType || "USER",
      assignment_type: serviceForm.assignmentType === 'AUTO' ? 'AUTOMATIC' : (serviceForm.assignmentType || "AUTOMATIC"),
      user_id: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}').id : null,
      schedules: schedules,
      questions: formattedQuestions
    };

    try {
      setIsLoading(true);
      const res = await fetch(
        `${API_BASE}/appointments/services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create service");
      }

      // Convert backend response back to frontend format
      const createdService: Service = {
        id: data.id,
        name: data.title,
        description: data.description || "",
        duration: data.duration_minutes,
        price: Number(data.booking_fee || 0),
        icon: "📅",
        location: data.location || "",
        type: Number(data.booking_fee) > 0 ? "Paid" : "Free",
        providers: [],
        published: data.is_published,
        bookType: data.target_type,
        assignmentType: data.assignment_type === 'AUTOMATIC' ? 'AUTO' : 'MANUAL',
        questions: (data.questions || []).map((q: any) => ({
          id: q.id,
          label: q.label,
          type: q.field_type?.toLowerCase() || 'text',
          required: q.is_mandatory
        })),
        workingHours: workingHours
      };

      setServices((prev) => [...prev, createdService]);

      alert("Service saved to database successfully ✅");

      setIsEditingService(false);
      setSelectedService(null);
      setServiceForm({});
      setWorkingHours({});
      setQuestions([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [serviceForm, workingHours, questions]);

  const generateShareLink = useCallback(() => {
    if (selectedService) {
      return `${window.location.origin}/book/${selectedService.id}`;
    }
    return '';
  }, [selectedService]);

  return (
    <div className="flex h-[calc(100vh-24px)] overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`bg-white/95 backdrop-blur border-r border-slate-200 transition-all duration-300 flex flex-col shadow-[0_10px_40px_rgba(15,23,42,0.12)] ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
                Ar
              </div>
              <div className="text-sm font-black leading-tight">
                <span className="block text-slate-900">Aarakshan</span>
                <span className="block text-[10px] text-slate-400">Organiser</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'Workspace' : 'Nav'}
          </p>
          <NavItem id="SERVICES" icon={Settings} label="My Services" />
          <NavItem id="BOOKINGS" icon={Calendar} label="All Bookings" />
          <NavItem id="CALENDAR" icon={BarChart3} label="Calendar View" />
          <NavItem id="SETTINGS" icon={Users} label="Resources" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ${!sidebarOpen && 'justify-center'}`}>
            <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="Organiser" />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-500">Organiser</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={onLogout}
                className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8">
        <header className="flex justify-between items-center mb-8 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {activeTab === 'SERVICES' && 'Service & Appointment Configuration'}
              {activeTab === 'BOOKINGS' && 'All Bookings'}
              {activeTab === 'CALENDAR' && 'Calendar View'}
              {activeTab === 'SETTINGS' && 'Resource Management'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your appointment types and bookings.</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4" />
            Last synced a few seconds ago
          </div>
        </header>

        {activeTab === 'SERVICES' && (
          <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_rgba(15,23,42,0.06)] px-4 py-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all text-sm"
                />
              </div>
              <button 
                onClick={() => {
                  const newService: Service = {
                    id: `s${services.length + 1}`,
                    name: 'New Service',
                    description: '',
                    duration: 30,
                    price: 0,
                    icon: '📅',
                    location: '',
                    type: 'Free',
                    providers: [],
                    published: false,
                    bookType: 'USER',
                  };
                  setServices([...services, newService]);
                  handleEditService(newService);
                }}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_14px_40px_rgba(15,23,42,0.5)] hover:bg-slate-800 transition-all"
              >
                <PlusCircle className="w-4.5 h-4.5" /> Create Service
              </button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map(service => (
                <div
                  key={service.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_16px_40px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900/5 flex items-center justify-center text-2xl">
                      {service.icon}
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleTogglePublish(service.id)}
                        className={`p-2 rounded-lg transition-colors border ${
                          service.published 
                            ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-100' 
                            : 'text-slate-400 hover:bg-slate-50 border-slate-100'
                        }`}
                        title={service.published ? 'Unpublish' : 'Publish'}
                      >
                        {service.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleEditService(service)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 mb-1 text-sm line-clamp-1">{service.name}</h3>
                  <p className="text-[13px] text-slate-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {service.description || 'No description yet. Describe this appointment for visitors.'}
                  </p>
                  
                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-semibold text-slate-900">{service.duration} mins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Price</span>
                      <span className="font-semibold text-slate-900">
                        {service.price ? `₹${service.price}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        service.published 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {service.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleEditService(service)}
                      className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-bold text-[11px] hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      Configure
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedService(service);
                        setShareLinkVisible(true);
                      }}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                      title="Share link"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}

              {!isFetching && services.length === 0 && (
                <div className="col-span-full py-10 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Calendar className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No services yet</p>
                  <p className="text-xs text-slate-500 mt-1">Create your first appointment type to start accepting bookings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'BOOKINGS' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">View All Meetings</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm">
                  All Time
                </button>
                <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100">
                  Upcoming
                </button>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by customer..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 w-full sm:w-64 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70">
                  <tr className="text-left text-[11px] text-slate-400 font-bold uppercase tracking-[0.12em]">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Time</th>
                    <th className="px-6 py-3.5">Resource</th>
                    <th className="px-6 py-3.5">Answers</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_APPOINTMENTS.map((apt) => (
                    <tr key={apt.id} className="text-sm hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{apt.userName}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{apt.date}</div>
                        <div className="text-slate-400 text-[11px]">{apt.timeSlot}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{apt.providerName}</td>
                      <td className="px-6 py-4 text-slate-600">+919876543210</td>
                      <td className="px-6 py-4">
                        <select 
                          className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border-none outline-none ${
                            apt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 
                            apt.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}
                          defaultValue={apt.status}
                        >
                          <option value="CONFIRMED">Booked</option>
                          <option value="PENDING">Request</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-900 font-semibold hover:underline text-sm">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'CALENDAR' || activeTab === 'SETTINGS') && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.05)] animate-fade-in">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 mb-6 shadow-inner">
              <Settings className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Feature Coming Soon</h2>
            <p className="text-slate-500 max-w-sm text-center mt-2 text-sm">
              This feature is currently under development. Stay tuned for calendar insights and resource management tools.
            </p>
          </div>
        )}

        {/* Share Link Modal */}
        {shareLinkVisible && selectedService && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShareLinkVisible(false)}>
            <div className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(15,23,42,0.5)] max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Share Service</h3>
                <button onClick={() => setShareLinkVisible(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Share Link</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={generateShareLink()}
                      readOnly
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generateShareLink());
                        alert('Link copied to clipboard!');
                      }}
                      className="px-3.5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 text-sm"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedService.published !== false}
                    onChange={() => {}}
                    className="w-4 h-4 text-slate-900 rounded"
                    disabled
                  />
                  <span className="text-sm text-slate-700">Can share unpublished appointment</span>
                </label>
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setShareLinkVisible(false)}
                    className="w-full px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Configuration Modal */}
        {isEditingService && selectedService && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-[0_26px_90px_rgba(15,23,42,0.6)] max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-900/5 flex items-center justify-center text-xl">
                    {selectedService.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Appointment Title</span>
                    <input 
                      type="text" 
                      value={serviceForm.name || selectedService.name}
                      onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                      className="text-lg font-semibold border-none outline-none bg-transparent focus:ring-2 focus:ring-slate-900/5 rounded px-2 text-slate-900"
                      placeholder="Service name"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button 
                    onClick={() => handleTogglePublish(selectedService.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      serviceForm.published 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {serviceForm.published ? 'Published' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => setIsEditingService(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Configuration Tabs */}
              <div className="border-b border-slate-100 px-5 shrink-0 bg-white">
                <div className="flex gap-1">
                  {(['BASIC', 'SCHEDULE', 'QUESTIONS', 'OPTIONS', 'MESSAGES'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setConfigTab(tab)}
                      className={`px-4 py-3 text-xs font-bold transition-colors border-b-2 ${
                        configTab === tab
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                {configTab === 'BASIC' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Duration</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={serviceForm.duration ? `${String(Math.floor(serviceForm.duration / 60)).padStart(2, '0')}:${String(serviceForm.duration % 60).padStart(2, '0')}` : '00:30'}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                setServiceForm({...serviceForm, duration: (hours || 0) * 60 + (minutes || 0)});
                              }}
                              className="w-24 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                              placeholder="00:30"
                            />
                            <span className="text-xs text-slate-500">Hours</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Location</label>
                          <input 
                            type="text" 
                            value={serviceForm.location || selectedService.location}
                            onChange={(e) => setServiceForm({...serviceForm, location: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                            placeholder="Doctor's Office"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">If Location is not set, consider it an Online Appointment</p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-3 tracking-[0.15em]">Book</label>
                          <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input 
                                type="radio" 
                                name="bookType"
                                checked={serviceForm.bookType === 'USER'}
                                onChange={() => setServiceForm({...serviceForm, bookType: 'USER'})}
                                className="w-4 h-4 text-slate-900"
                              />
                              <span className="font-medium">User</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input 
                                type="radio" 
                                name="bookType"
                                checked={serviceForm.bookType === 'RESOURCE'}
                                onChange={() => setServiceForm({...serviceForm, bookType: 'RESOURCE'})}
                                className="w-4 h-4 text-slate-900"
                              />
                              <span className="font-medium">Resources</span>
                            </label>
                          </div>

                          {serviceForm.bookType === 'USER' && (
                            <div className="space-y-2">
                              <label className="block text-[11px] text-slate-500 mb-2 uppercase tracking-[0.12em]">Users</label>
                              <div className="flex flex-wrap gap-2">
                                {selectedService.providers.map((provider, idx) => (
                                  <button
                                    key={idx}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                  >
                                    {provider} <span className="text-[10px] text-slate-400">A{idx + 1}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {serviceForm.bookType === 'RESOURCE' && (
                            <div className="space-y-2">
                              <label className="block text-[11px] text-slate-500 mb-2 uppercase tracking-[0.12em]">Resources</label>
                              <div className="flex flex-wrap gap-2">
                                {['Resource 1', 'Resource 2'].map((resource, idx) => (
                                  <button
                                    key={idx}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                  >
                                    {resource} <span className="text-[10px] text-slate-400">R{idx + 1}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-3 tracking-[0.15em]">Assignment</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input 
                                type="radio" 
                                name="assignment"
                                checked={serviceForm.assignmentType === 'AUTO'}
                                onChange={() => setServiceForm({...serviceForm, assignmentType: 'AUTO'})}
                                className="w-4 h-4 text-slate-900"
                              />
                              <span className="font-medium">Automatically</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input 
                                type="radio" 
                                name="assignment"
                                checked={serviceForm.assignmentType === 'MANUAL'}
                                onChange={() => setServiceForm({...serviceForm, assignmentType: 'MANUAL'})}
                                className="w-4 h-4 text-slate-900"
                              />
                              <span className="font-medium">By visitor</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={serviceForm.manageCapacity || false}
                              onChange={(e) => setServiceForm({...serviceForm, manageCapacity: e.target.checked})}
                              className="w-4 h-4 text-slate-900 rounded"
                            />
                            <span className="text-sm text-slate-700">Manage capacity</span>
                          </label>
                          {serviceForm.manageCapacity && (
                            <div className="mt-2">
                              <input 
                                type="number" 
                                value={serviceForm.maxBookingsPerSlot || ''}
                                onChange={(e) => setServiceForm({...serviceForm, maxBookingsPerSlot: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                                placeholder="Allow simultaneous appointment(s) per user"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Picture */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Picture</label>
                        <div className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-slate-900/40 transition-colors cursor-pointer bg-slate-50/60">
                          {serviceForm.picture ? (
                            <img src={serviceForm.picture} alt="Service" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <>
                              <ImageIcon className="w-10 h-10 text-slate-400" />
                              <span className="text-sm text-slate-500">Click to upload</span>
                            </>
                          )}
                          <div className="flex gap-2">
                            <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg">
                              <Upload className="w-4 h-4 text-slate-500" />
                            </button>
                            {serviceForm.picture && (
                              <button 
                                onClick={() => setServiceForm({...serviceForm, picture: undefined})}
                                className="p-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {configTab === 'SCHEDULE' && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">Every</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">From</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">To</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {DAYS_OF_WEEK.map(day => (
                            <React.Fragment key={day}>
                              {(workingHours[day] || []).length > 0 ? (
                                workingHours[day].map((slot, idx) => (
                                  <tr key={slot.id}>
                                    {idx === 0 && (
                                      <td rowSpan={workingHours[day].length} className="px-4 py-3 text-sm font-medium text-slate-900 align-top">
                                        {day}
                                      </td>
                                    )}
                                    <td className="px-4 py-3">
                                      <input
                                        type="time"
                                        value={slot.from}
                                        onChange={(e) => {
                                          const updated = workingHours[day].map(s => 
                                            s.id === slot.id ? {...s, from: e.target.value} : s
                                          );
                                          setWorkingHours({...workingHours, [day]: updated});
                                        }}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="time"
                                        value={slot.to}
                                        onChange={(e) => {
                                          const updated = workingHours[day].map(s => 
                                            s.id === slot.id ? {...s, to: e.target.value} : s
                                          );
                                          setWorkingHours({...workingHours, [day]: updated});
                                        }}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        onClick={() => handleRemoveTimeSlot(day, slot.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{day}</td>
                                  <td colSpan={3} className="px-4 py-3">
                                    <button
                                      onClick={() => handleAddTimeSlot(day)}
                                      className="text-xs text-slate-900 font-semibold hover:underline"
                                    >
                                      Add time slot
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      onClick={() => {
                        DAYS_OF_WEEK.forEach(day => {
                          if (!workingHours[day] || workingHours[day].length === 0) {
                            handleAddTimeSlot(day);
                          }
                        });
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800"
                    >
                      Add a line
                    </button>
                  </div>
                )}

                {configTab === 'QUESTIONS' && (
                  <div className="space-y-6">
                    {/* Existing Questions Table */}
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">Question</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">Answer type</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">Mandatory</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-slate-400 tracking-[0.12em]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {questions.map(q => (
                            <tr key={q.id}>
                              <td className="px-4 py-3 text-sm text-slate-900">{q.label}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type}
                              </td>
                              <td className="px-4 py-3">
                                <input type="checkbox" checked={q.required} disabled className="w-4 h-4 text-slate-900 rounded" />
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleRemoveQuestion(q.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {questions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                                No questions added yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Question Form */}
                    <div className="border-t border-slate-200 pt-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-900">Add a question</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Answer type</label>
                          <div className="grid grid-cols-2 gap-2">
                            {QUESTION_TYPES.map(type => (
                              <button
                                key={type.value}
                                onClick={() => setNewQuestion({...newQuestion, type: type.value, options: (type.value === 'radio' || type.value === 'checkbox') ? ['Option 1'] : undefined})}
                                className={`px-3 py-2 border rounded-xl text-[11px] font-medium transition-colors ${
                                  newQuestion.type === type.value
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>
                          {(newQuestion.type === 'radio' || newQuestion.type === 'checkbox') && (
                            <div className="mt-4 space-y-2">
                              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Options</label>
                              {(newQuestion.options || []).map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...(newQuestion.options || [])];
                                      updated[idx] = e.target.value;
                                      setNewQuestion({...newQuestion, options: updated});
                                    }}
                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-sm"
                                    placeholder={`Option ${idx + 1}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = (newQuestion.options || []).filter((_, i) => i !== idx);
                                      setNewQuestion({...newQuestion, options: updated});
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => setNewQuestion({...newQuestion, options: [...(newQuestion.options || []), `Option ${(newQuestion.options?.length || 0) + 1}`]})}
                                className="text-xs text-slate-900 font-semibold hover:underline"
                              >
                                + Add Option
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Question</label>
                            <input
                              type="text"
                              value={newQuestion.label || ''}
                              onChange={(e) => setNewQuestion({...newQuestion, label: e.target.value})}
                              className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                              placeholder="Anything else we should know?"
                            />
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newQuestion.required || false}
                              onChange={(e) => setNewQuestion({...newQuestion, required: e.target.checked})}
                              className="w-4 h-4 text-slate-900 rounded"
                            />
                            <span className="text-sm text-slate-700">Mandatory Answer</span>
                          </label>
                          <button
                            onClick={handleAddQuestion}
                            disabled={!newQuestion.label || ((newQuestion.type === 'radio' || newQuestion.type === 'checkbox') && (!newQuestion.options || newQuestion.options.length === 0))}
                            className="w-full px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Question
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {configTab === 'OPTIONS' && (
                  <div className="space-y-6">
                    <div className="space-y-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={serviceForm.manualConfirmation || false}
                          onChange={(e) => setServiceForm({...serviceForm, manualConfirmation: e.target.checked})}
                          className="w-4 h-4 text-slate-900 rounded"
                        />
                        <span className="text-sm text-slate-700">Manual confirmation</span>
                        {serviceForm.manualConfirmation && (
                          <span className="text-[11px] text-slate-500">Upto 50% of capacity</span>
                        )}
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={serviceForm.advancePayment || false}
                          onChange={(e) => setServiceForm({...serviceForm, advancePayment: e.target.checked})}
                          className="w-4 h-4 text-slate-900 rounded"
                        />
                        <span className="text-sm text-slate-700">Paid Booking</span>
                        {serviceForm.advancePayment && (
                          <div className="ml-4 flex items-center gap-1 text-[11px] text-slate-500">
                            <span>Booking Fees (Rs</span>
                            <input
                              type="number"
                              value={serviceForm.price || 0}
                              onChange={(e) => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})}
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-xs inline-block"
                            />
                            <span>per booking)</span>
                          </div>
                        )}
                      </label>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Create Slot</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={serviceForm.slotCreation || String(selectedService.duration)}
                            onChange={(e) => setServiceForm({...serviceForm, slotCreation: e.target.value})}
                            className="w-24 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                            placeholder="00:30"
                          />
                          <span className="text-xs text-slate-500">hours</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Cancellation</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">up to</span>
                          <input 
                            type="number" 
                            value={serviceForm.cancellationHours || 1}
                            onChange={(e) => setServiceForm({...serviceForm, cancellationHours: parseInt(e.target.value)})}
                            className="w-20 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                          />
                          <span className="text-sm text-slate-500">hour(s) before the booking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {configTab === 'MESSAGES' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Introduction page message</label>
                      <textarea
                        value={serviceForm.introductionMessage || ''}
                        onChange={(e) => setServiceForm({...serviceForm, introductionMessage: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                        placeholder="Schedule your visit today and experience expert care."
                      />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-[0.15em]">Confirmation page message</label>
                      <textarea
                        value={serviceForm.confirmationMessage || ''}
                        onChange={(e) => setServiceForm({...serviceForm, confirmationMessage: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-sm"
                        placeholder="Thank you for your trust, we look forward to meeting you."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
                <button 
                  onClick={() => setIsEditingService(false)}
                  className="px-5 py-2 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveService}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrganiserPortal;
