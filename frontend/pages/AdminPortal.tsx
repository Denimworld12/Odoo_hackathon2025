import React, { useState, useEffect } from 'react';
import { User, Service } from '../types';
import { 
  Users, Calendar, Clock, BarChart3, Settings, Shield, Search, 
  Menu, X, Bell, LogOut, Trash2, Edit3, Check, Filter, TrendingUp, UserCheck,
  PlusCircle, MapPin, DollarSign, Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface AdminPortalProps {
  user: User;
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SERVICES' | 'BOOKINGS' | 'USERS' | 'REPORTS'>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // --- REAL DATA STATE ---
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State matching your Schema
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    duration_minutes: 30,
    booking_fee: '0.00',
    manual_confirmation: false,
    is_published: false,
    target_type: 'USER',
    assignment_type: 'AUTOMATIC'
  });

  // 1. Fetch Services from Backend
  const fetchServices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/all-appointments');
      setServices(res.data.appointments || []);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // 2. Handle Create & Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        // UPDATE
        await axios.put(`http://localhost:5000/services/${editingId}`, formData, { headers });
      } else {
        // CREATE
        await axios.post('http://localhost:5000/services', formData, { headers });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      fetchServices();
    } catch (err) {
      alert("Action failed. Check console.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this appointment type permanently?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const openEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      description: service.description || '',
      location: service.location || '',
      duration_minutes: service.duration_minutes,
      booking_fee: service.booking_fee,
      manual_confirmation: service.manual_confirmation,
      is_published: service.is_published,
      target_type: service.target_type,
      assignment_type: service.assignment_type
    });
    setIsModalOpen(true);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {sidebarOpen && <span>{label}</span>}
    </button>
  );


//   const handleCreateService = async () => {
//   try {
//     setIsSaving(true);

//     const res = await fetch(
//       "http://localhost:5000/api/appointments/create-appointment",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           title: newService.title,
//           description: newService.description,
//           location: newService.location,
//           duration_minutes: Number(newService.duration_minutes),
//           booking_fee: Number(newService.booking_fee),
//           is_published: true
//         })
//       }
//     );

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message || "Failed to create service");

//     setShowAddServiceModal(false);
//     setNewService({
//       title: "",
//       description: "",
//       location: "",
//       duration_minutes: 30,
//       booking_fee: 0
//     });

//     alert("Service created successfully");
//   } catch (err: any) {
//     alert(err.message);
//   } finally {
//     setIsSaving(false);
//   }
// };


  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - Same as before */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 tracking-tighter">BookEase</div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-100 rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem id="DASHBOARD" icon={BarChart3} label="Dashboard" />
          <NavItem id="SERVICES" icon={Shield} label="Services" />
          <NavItem id="BOOKINGS" icon={Calendar} label="All Bookings" />
          <NavItem id="USERS" icon={Users} label="User Management" />
          <NavItem id="REPORTS" icon={TrendingUp} label="Reports" />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="flex items-center gap-3 w-full text-slate-400 hover:text-red-500 p-3">
            <LogOut className="w-4 h-4" />{sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h1 className="text-2xl font-black text-slate-900 capitalize">{activeTab.toLowerCase()}</h1>
              <p className="text-slate-500 text-sm italic">Managing appointments and rules.</p>
           </div>
        </header>

        {activeTab === 'SERVICES' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search your services..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium" />
              </div>
              <button 
                onClick={() => { setEditingId(null); setFormData({title: '', description: '', location: '', duration_minutes: 30, booking_fee: '0.00', manual_confirmation: false, is_published: false, target_type: 'USER', assignment_type: 'AUTOMATIC'}); setIsModalOpen(true); }}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <PlusCircle className="w-5 h-5" /> Add New Type
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                      {service.title.charAt(0)}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(service)} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(service.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-1 leading-tight">{service.title}</h3>
                  <p className="text-xs text-slate-500 mb-6 line-clamp-2 font-medium">{service.description || "No description provided."}</p>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tighter">
                       <div className="flex items-center gap-1.5 text-slate-400"><Clock className="w-3.5 h-3.5" />{service.duration_minutes} Minutes</div>
                       <div className="text-indigo-600">${service.booking_fee} Fee</div>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${service.is_published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                         {service.is_published ? 'Published' : 'Draft'}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400">{service.target_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DYNAMIC MODAL FOR POST/UPDATE --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {editingId ? 'Update Appointment' : 'New Appointment Type'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Title</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold" required placeholder="e.g. Brainstorming Session" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Duration (Min)</label>
                    <input type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Booking Fee ($)</label>
                    <input type="number" step="0.01" value={formData.booking_fee} onChange={e => setFormData({...formData, booking_fee: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-bold" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Location / Venue</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                    <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-bold" placeholder="Room Number or URL" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input type="checkbox" checked={formData.manual_confirmation} onChange={e => setFormData({...formData, manual_confirmation: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded-lg" />
                      <span className="text-[10px] font-black text-slate-500 uppercase leading-none">Manual Confirmation</span>
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input type="checkbox" checked={formData.is_published} onChange={e => setFormData({...formData, is_published: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded-lg" />
                      <span className="text-[10px] font-black text-slate-500 uppercase leading-none">Live / Published</span>
                   </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-600 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
                >
                  {isLoading ? "Processing..." : (editingId ? <><Edit3 className="w-4 h-4"/> Update Appointment</> : <><Save className="w-4 h-4"/> Create Appointment Type</>)}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'DASHBOARD' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             {/* Original KPI cards code here... */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Use the KPI card mapping from your previous code */}
             </div>
             {/* Charts Row here... */}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;

function setShowAddServiceModal(arg0: boolean) {
  throw new Error('Function not implemented.');
}
