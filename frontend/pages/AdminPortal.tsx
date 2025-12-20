
import React, { useState } from 'react';
import { User, Appointment, Service, Provider } from '../types';
import { 
  Users, Calendar, Clock, BarChart3, Settings, Shield, Search, 
  Menu, X, Bell, LogOut, Trash2, Edit3, Check, Filter, TrendingUp, UserCheck,
  // Added PlusCircle to imports to fix the error on line 246
  PlusCircle
} from 'lucide-react';
import { MOCK_SERVICES, MOCK_PROVIDERS, MOCK_APPOINTMENTS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface AdminPortalProps {
  user: User;
  onLogout: () => void;
}

const data = [
  { name: '09:00', bookings: 4 },
  { name: '10:00', bookings: 7 },
  { name: '11:00', bookings: 5 },
  { name: '12:00', bookings: 2 },
  { name: '13:00', bookings: 6 },
  { name: '14:00', bookings: 9 },
  { name: '15:00', bookings: 4 },
  { name: '16:00', bookings: 3 },
];

const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899'];

const AdminPortal: React.FC<AdminPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SERVICES' | 'BOOKINGS' | 'USERS' | 'REPORTS'>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

const [newService, setNewService] = useState({
  title: "",
  description: "",
  location: "",
  duration_minutes: 30,
  booking_fee: 0
});

const [isSaving, setIsSaving] = useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {sidebarOpen && <span>{label}</span>}
    </button>
  );


  const handleCreateService = async () => {
  try {
    setIsSaving(true);

    const res = await fetch(
      "http://localhost:5000/api/appointments/create-appointment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newService.title,
          description: newService.description,
          location: newService.location,
          duration_minutes: Number(newService.duration_minutes),
          booking_fee: Number(newService.booking_fee),
          is_published: true
        })
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create service");

    setShowAddServiceModal(false);
    setNewService({
      title: "",
      description: "",
      location: "",
      duration_minutes: 30,
      booking_fee: 0
    });

    alert("Service created successfully");
  } catch (err: any) {
    alert(err.message);
  } finally {
    setIsSaving(false);
  }
};


  return (
    <div className="flex h-[calc(100vh-24px)] overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">BookEase</div>}
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
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ${!sidebarOpen && 'justify-center'}`}>
            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="Admin" />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500">System Admin</p>
              </div>
            )}
            {sidebarOpen && <button onClick={onLogout} className="ml-auto text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>}
          </div>
        </div>
      </aside>


      {showAddServiceModal && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900">Add New Service</h2>
        <button onClick={() => setShowAddServiceModal(false)}>
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Service Title"
          value={newService.title}
          onChange={(e) =>
            setNewService({ ...newService, title: e.target.value })
          }
          className="w-full border rounded-xl px-4 py-2"
        />

        <textarea
          placeholder="Description"
          value={newService.description}
          onChange={(e) =>
            setNewService({ ...newService, description: e.target.value })
          }
          className="w-full border rounded-xl px-4 py-2"
          rows={3}
        />

        <input
          type="text"
          placeholder="Location"
          value={newService.location}
          onChange={(e) =>
            setNewService({ ...newService, location: e.target.value })
          }
          className="w-full border rounded-xl px-4 py-2"
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Duration (mins)"
            value={newService.duration_minutes}
            onChange={(e) =>
              setNewService({
                ...newService,
                duration_minutes: e.target.value
              })
            }
            className="border rounded-xl px-4 py-2"
          />

          <input
            type="number"
            placeholder="Price"
            value={newService.booking_fee}
            onChange={(e) =>
              setNewService({
                ...newService,
                booking_fee: e.target.value
              })
            }
            className="border rounded-xl px-4 py-2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowAddServiceModal(false)}
          className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
        >
          Cancel
        </button>

        <button
          disabled={isSaving}
          onClick={handleCreateService}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Create Service"}
        </button>
      </div>
    </div>
  </div>
)}


      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'DASHBOARD' && 'System Overview'}
              {activeTab === 'SERVICES' && 'Service Management'}
              {activeTab === 'BOOKINGS' && 'Global Bookings'}
              {activeTab === 'USERS' && 'User & Provider Accounts'}
              {activeTab === 'REPORTS' && 'Analytics & Insights'}
            </h1>
            <p className="text-slate-500 text-sm">Managing your booking ecosystem at a glance.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700 hidden sm:block">June 15, 2024</span>
            </div>
          </div>
        </header>

        {activeTab === 'DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Appointments', value: '1,284', trend: '+12%', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
                { label: 'Total Revenue', value: '$64,200', trend: '+8%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
                { label: 'Active Users', value: '3,120', trend: '+15%', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                { label: 'Active Providers', value: '42', trend: '0%', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${kpi.bg} ${kpi.color} p-3 rounded-2xl`}>
                      <kpi.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{kpi.trend}</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">{kpi.label}</h3>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900 text-lg">Peak Booking Hours</h3>
                  <select className="text-sm bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                    <option>Today</option>
                    <option>Yesterday</option>
                  </select>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900 text-lg">Service Distribution</h3>
                  <button className="text-indigo-600 text-sm font-bold">Details</button>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Medical', value: 400 },
                          { name: 'Dental', value: 300 },
                          { name: 'Therapy', value: 300 },
                          { name: 'Other', value: 200 },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 ml-4">
                    {['Medical', 'Dental', 'Therapy', 'Other'].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="font-bold text-slate-900">Recent Appointments</h3>
                 <button className="text-sm text-indigo-600 font-bold hover:underline">View All</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Provider</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {MOCK_APPOINTMENTS.map((apt) => (
                        <tr key={apt.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{apt.userName}</td>
                          <td className="px-6 py-4 text-slate-600">{apt.serviceName}</td>
                          <td className="px-6 py-4 text-slate-600">{apt.providerName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-indigo-600 p-1">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'SERVICES' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 shadow-sm"
                />
              </div>
              <button
  onClick={() => setShowAddServiceModal(true)}
  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
>
 Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_SERVICES.map(service => (
                <div key={service.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{service.icon}</div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-slate-500 mb-6">{service.description}</p>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold">
                    <div className="text-indigo-600">{service.duration} mins</div>
                    <div className="text-slate-900">${service.price}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Published
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'BOOKINGS' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md">All Time</button>
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50">Upcoming</button>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"><Filter className="w-5 h-5 text-slate-400" /></button>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Filter by customer..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Date/Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.from({length: 8}).map((_, i) => {
                    const apt = MOCK_APPOINTMENTS[i % MOCK_APPOINTMENTS.length];
                    return (
                      <tr key={i} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">#APT-00{i+102}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                            <span className="font-bold text-slate-900">{apt.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{apt.serviceName}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium">{apt.date}</div>
                          <div className="text-slate-400 text-[10px]">{apt.timeSlot}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${apt.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                            <span className="text-xs font-bold text-slate-700">{apt.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-indigo-600 font-bold hover:underline">Manage</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'USERS' || activeTab === 'REPORTS') && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-6">
              <Shield className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Module Under Construction</h2>
            <p className="text-slate-500 max-w-sm text-center mt-2"> We are currently fine-tuning this specific module to provide a premium experience. Stay tuned!</p>
            <button onClick={() => setActiveTab('DASHBOARD')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Return to Overview</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
