
import React, { useState, useMemo } from 'react';
import { User, Appointment, Service, Provider } from '../types';
import { 
  Calendar, Clock, MapPin, User as UserIcon, LogOut, LayoutDashboard, 
  Settings, CheckCircle2, ChevronRight, Search, PlusCircle, X, Check, Filter
} from 'lucide-react';
import { MOCK_SERVICES, MOCK_PROVIDERS, MOCK_APPOINTMENTS, TIME_SLOTS } from '../constants';

interface UserPortalProps {
  user: User;
  onLogout: () => void;
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

  const filteredServices = useMemo(() => {
    return MOCK_SERVICES.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || service.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const startBooking = (service?: Service) => {
    if (service) setSelectedService(service);
    setBookingStep(service ? 2 : 1);
    setActiveTab('BOOKING');
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setBookingStep(6);
  };

  const resetBooking = () => {
    setBookingStep(1);
    setSelectedService(null);
    setSelectedProvider(null);
    setSelectedTime('');
    setBookingConfirmed(false);
    setActiveTab('DASHBOARD');
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Calendar className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
            BookEase
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`transition-colors hover:text-indigo-600 ${activeTab === 'DASHBOARD' ? 'text-indigo-600' : ''}`}
          >
            Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('BOOKING')}
             className={`transition-colors hover:text-indigo-600 ${activeTab === 'BOOKING' ? 'text-indigo-600' : ''}`}
          >
            Book Appointment
          </button>
          <button 
             onClick={() => setActiveTab('PROFILE')}
             className={`transition-colors hover:text-indigo-600 ${activeTab === 'PROFILE' ? 'text-indigo-600' : ''}`}
          >
            My Appointments
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-600 transition-all text-sm"
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
                  </div>
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-5 tracking-tight">Appointments</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
                    <div className="p-5">
                      {/* Card Title */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {service.name}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          service.type === 'Free' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {service.type}
                        </span>
                      </div>

                      {/* Card Content Split */}
                      <div className="flex flex-col md:flex-row gap-5">
                        {/* Picture Area */}
                        <div className="w-full md:w-44 h-44 bg-slate-50 rounded-2xl flex items-center justify-center text-5xl relative overflow-hidden group-hover:scale-[1.01] transition-transform shadow-inner border border-slate-100">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent"></div>
                          <span className="relative z-10">{service.icon}</span>
                        </div>

                        {/* Metadata Area */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Users / Resources</h4>
                              <div className="grid grid-cols-1 gap-1.5">
                                {service.providers.map((p, i) => (
                                  <div key={i} className="flex items-center gap-2 text-slate-700 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-50 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                    {p}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Location</h4>
                              <div className="flex items-center gap-2 text-slate-600 font-medium px-1 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{service.location}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => startBooking(service)}
                            className="mt-4 bg-slate-900 text-white w-full py-2.5 rounded-xl font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group/btn"
                          >
                            Book Now
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>

                      {/* Footer Message Area */}
                      <div className="mt-4 pt-4 border-t border-slate-50">
                        <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Introduction Message</h4>
                        <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">
                          "{service.description}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="text-4xl mb-3 opacity-20">🔍</div>
                    <h3 className="text-sm font-bold text-slate-400">No appointments found matching your criteria.</h3>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'BOOKING' && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            {/* Steps Progress */}
            {!bookingConfirmed && (
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        bookingStep === s ? 'bg-indigo-600 text-white ring-2 ring-indigo-50' : 
                        bookingStep > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {bookingStep > s ? <Check className="w-4 h-4" /> : s}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Step {s}</span>
                    </div>
                  ))}
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(bookingStep - 1) * 25}%` }}></div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5 sm:p-8">
              {/* Step 1: Service */}
              {bookingStep === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Select a Service</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MOCK_SERVICES.map((s) => (
                      <button 
                        key={s.id}
                        onClick={() => { setSelectedService(s); setBookingStep(2); }}
                        className={`p-4 text-left rounded-xl border transition-all ${
                          selectedService?.id === s.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'
                        }`}
                      >
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        <div className="text-[10px] text-slate-500">{s.duration} mins • ${s.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Provider */}
              {bookingStep === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Choose Your Specialist</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MOCK_PROVIDERS.map((p) => (
                      <button 
                        key={p.id}
                        onClick={() => { setSelectedProvider(p); setBookingStep(3); }}
                        className={`p-4 flex items-center gap-3 text-left rounded-xl border transition-all ${
                          selectedProvider?.id === p.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'
                        }`}
                      >
                        <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.specialty}</div>
                          <div className="text-[9px] text-indigo-600 font-medium mt-0.5">Available: {p.availability.join(', ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setBookingStep(1)} className="px-4 py-2 text-slate-500 font-bold text-sm">Back</button>
                  </div>
                </div>
              )}

              {/* Step 3: Date & Time */}
              {bookingStep === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Select Date & Time</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-xs uppercase tracking-wide">June 2024</h3>
                          <div className="flex gap-1">
                            <button className="p-1 hover:bg-white rounded text-slate-400">{'<'}</button>
                            <button className="p-1 hover:bg-white rounded text-slate-400">{'>'}</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 mb-1">
                          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                            <button 
                              key={d} 
                              onClick={() => setSelectedDate(`2024-06-${d.toString().padStart(2, '0')}`)}
                              className={`py-1.5 text-xs rounded-md ${d === 25 ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-slate-700'}`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold mb-3 text-xs uppercase tracking-wide">Available Slots</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map(t => (
                          <button 
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`py-2 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                              selectedTime === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 hover:border-indigo-200 text-slate-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setBookingStep(2)} className="px-4 py-2 text-slate-500 font-bold text-sm">Back</button>
                    <button 
                      disabled={!selectedTime}
                      onClick={() => setBookingStep(4)} 
                      className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Questions */}
              {bookingStep === 4 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">Details</h2>
                  <p className="text-xs text-slate-500 mb-5">Help us prepare for your visit.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Reason for Visit</label>
                      <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white text-sm" rows={2} placeholder="Briefly describe..."></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Medical Allergies</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white text-sm" placeholder="N/A" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setBookingStep(3)} className="px-4 py-2 text-slate-500 font-bold text-sm">Back</button>
                    <button onClick={() => setBookingStep(5)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm">Review</button>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {bookingStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Review & Confirm</h2>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Service</span>
                      <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Provider</span>
                      <span className="font-bold">{selectedProvider?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Date</span>
                      <span className="font-bold">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Time</span>
                      <span className="font-bold">{selectedTime}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Total Price</span>
                      <span className="text-lg font-black text-indigo-600">${selectedService?.price}</span>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex gap-3">
                    <CheckCircle2 className="text-indigo-600 w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-800 font-medium">Payment will be collected at the venue upon arrival.</p>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setBookingStep(4)} className="px-4 py-2 text-slate-500 font-bold text-sm">Back</button>
                    <button onClick={handleConfirmBooking} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md">Confirm Appointment</button>
                  </div>
                </div>
              )}

              {/* Step 6: Confirmation */}
              {bookingStep === 6 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Booking Confirmed!</h2>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    Your session with <strong>{selectedProvider?.name}</strong> is all set for <strong>{selectedDate}</strong>.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-xl inline-block text-left w-full max-w-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="text-indigo-400 w-4 h-4" />
                      <span className="text-xs font-bold text-slate-700">{selectedService?.location}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic font-medium">*Check your email for full details.</div>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                    <button onClick={resetBooking} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Dashboard</button>
                    <button className="border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50">Add to Calendar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'PROFILE' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="h-24 bg-indigo-600"></div>
               <div className="px-6 pb-6 -mt-10 flex flex-col md:flex-row items-end gap-5">
                 <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl border-4 border-white shadow-md" />
                 <div className="flex-1 pb-1">
                   <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
                   <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                 </div>
                 <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-xs mb-1">Edit Profile</button>
               </div>
             </div>

             <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black tracking-tight">Booking History</h2>
                  <div className="flex gap-1.5">
                    <button className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full uppercase tracking-widest">All</button>
                    <button className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 uppercase tracking-widest">Upcoming</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {MOCK_APPOINTMENTS.map((apt) => (
                    <div key={apt.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-slate-900 text-sm">{apt.serviceName}</h4>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                            apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">with {apt.providerName}</p>
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
                        {apt.status === 'PENDING' || apt.status === 'CONFIRMED' ? (
                          <button className="text-red-500 font-bold text-[10px] px-3 py-1.5 hover:bg-red-50 rounded-lg uppercase tracking-wider">Cancel</button>
                        ) : null}
                        <button className="bg-slate-50 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-slate-100 uppercase tracking-wider">Details</button>
                      </div>
                    </div>
                  ))}
                </div>
             </section>
           </div>
        )}
      </main>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('DASHBOARD')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Home</span>
        </button>
        <button onClick={() => setActiveTab('BOOKING')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'BOOKING' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Book</span>
        </button>
        <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'PROFILE' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <UserIcon className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Profile</span>
        </button>
      </div>
    </>
  );
};

export default UserPortal;
