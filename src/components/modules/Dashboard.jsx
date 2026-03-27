import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, DollarSign, AlertCircle, Clock, Users, Package, Bell } from 'lucide-react';
import StatCard from '../ui/StatCard';

function PendingCard({ title, items, color, onAction, actionLabel = 'View' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 16, borderRadius: 2, background: color }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', background: color + '20', color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{items.length}</span>
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--t-muted)', fontSize: 12 }}>All clear ✓</div>
        ) : items.slice(0, 8).map((item, i) => (
          <div key={i} style={{ padding: '9px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--bg-subtle)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-dark)' }}>{item.title}</div>
              <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{item.sub}</div>
            </div>
            {item.badge && <span style={{ background: item.badgeColor || 'var(--c-warning-light)', color: item.badgeTextColor || 'var(--t-secondary)', fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>{item.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const COLORS = ['var(--c-primary)', 'var(--c-success)', 'var(--c-info)', 'var(--c-teal)', 'var(--c-danger)', 'var(--c-warning)'];

export default function DashboardModule() {
  const { bookings, journalEntries, projects, employees, materialIndents, purchaseOrders, crmLeads, notifications, setActiveModule } = useAppStore();

  const stats = useMemo(() => {
    const approvedBookings = bookings.filter(b => b.status === 'approved' || b.status === 'registered');
    const totalBookingValue = approvedBookings.reduce((s, b) => s + (b.agreementValue || 0), 0);
    const totalCollected = bookings.reduce((s, b) => s + (b.payments || []).reduce((ps, p) => ps + (p.amount || 0), 0), 0);
    const pendingApprovals = bookings.filter(b => b.status === 'pending').length;
    const pendingPOs = purchaseOrders.filter(p => p.status === 'pending_approval').length;
    const overdueLeads = crmLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date() && l.stage !== 'Booked' && l.stage !== 'Lost').length;

    return { approvedBookings: approvedBookings.length, totalBookingValue, totalCollected, pendingApprovals, pendingPOs, overdueLeads, totalEmployees: employees.length };
  }, [bookings, purchaseOrders, crmLeads, employees]);

  // Collection chart data (last 6 months)
  const chartData = useMemo(() => {
    return MONTHS.slice(0, 6).map(m => ({
      month: m,
      collected: Math.floor(Math.random() * 5000000 + 1000000), // replace with real aggregation
    }));
  }, []);

  // Pending items
  const pendingBookings = bookings.filter(b => b.status === 'pending').map(b => ({
    title: b.customerName || 'Unnamed', sub: b.unitNo || '—',
    badge: 'Pending Approval', badgeColor: 'var(--c-warning-light)', badgeTextColor: 'var(--t-secondary)',
  }));

  const pendingPOItems = purchaseOrders.filter(p => p.status === 'pending_approval').map(p => ({
    title: p.poNo || p.id, sub: p.vendorName || '—',
    badge: 'Awaiting Director', badgeColor: 'var(--c-primary-light)', badgeTextColor: 'var(--c-primary)',
  }));

  const overdueFollowUps = crmLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date() && l.stage !== 'Booked' && l.stage !== 'Lost').map(l => ({
    title: l.name, sub: `Follow-up: ${l.followUpDate}`,
    badge: 'Overdue', badgeColor: 'var(--c-danger-light)', badgeTextColor: '#B42318',
  }));

  // Project completion
  const projectData = projects.map(p => ({
    name: (p.name || '').substring(0, 12),
    progress: p.completionPct || 0,
  })).slice(0, 6);

  // Notification summary
  const today = new Date();
  const tdsAlerts = today.getDate() <= 7 ? [{ title: 'TDS Due 7th', sub: 'Deposit TDS for last month', badge: '⚠ Due Soon', badgeColor: 'var(--c-warning-light)', badgeTextColor: 'var(--t-secondary)' }] : [];
  const gstAlerts = (today.getDate() === 10 || today.getDate() === 20) ? [{ title: 'GST Filing Reminder', sub: 'GSTR-1 / GSTR-3B due today', badge: 'Today', badgeColor: 'var(--c-danger-light)', badgeTextColor: '#B42318' }] : [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-dark)', marginTop: 2 }}>Good morning 👋</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Approved Bookings" value={stats.approvedBookings} sub={`↑ ₹${(stats.totalBookingValue / 10000000).toFixed(2)} Cr total`} color="blue" icon={BookOpen} />
        <StatCard label="Total Collected" value={`₹${(stats.totalCollected / 100000).toFixed(1)}L`} sub="↑ this month" color="green" icon={DollarSign} />
        <StatCard label="Active Projects" value={projects.filter(p => p.status === 'active' || !p.status).length} sub="neutral" color="purple" icon={TrendingUp} />
        <StatCard label="Employees" value={stats.totalEmployees} sub="active headcount" color="teal" icon={Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} sub="↓ needs action" color="amber" icon={Clock} />
        <StatCard label="Pending POs" value={stats.pendingPOs} sub="↓ awaiting approval" color="red" icon={Package} />
        <StatCard label="Overdue Follow-ups" value={stats.overdueLeads} sub="↓ overdue CRM tasks" color="purple" icon={AlertCircle} />
        <StatCard label="Unread Notifications" value={(notifications || []).filter(n => !n.read).length} sub="info updates" color="teal" icon={Bell} />
      </div>

      {/* Charts Row */}
      <div className="kpi-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 14 }}>Monthly Collections</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={24}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={v => [`₹${(v/100000).toFixed(1)}L`, 'Collected']} />
              <Bar dataKey="collected" fill="var(--c-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 14 }}>Project Progress</div>
          {projectData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--t-muted)', fontSize: 12 }}>No projects yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {projectData.map((p, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--t-primary)', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: 'var(--t-secondary)' }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${p.progress}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, marginBottom: 20 }}>
        <PendingCard title="Pending Booking Approvals" items={pendingBookings} color="var(--c-warning)" />
        <PendingCard title="PO Approvals Needed" items={pendingPOItems} color="var(--c-primary)" />
        <PendingCard title="CRM Follow-ups Overdue" items={overdueFollowUps} color="var(--c-danger)" />
      </div>

      {/* Compliance Alerts */}
      {(tdsAlerts.length > 0 || gstAlerts.length > 0) && (
        <div style={{ background: 'var(--c-warning-light)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--c-warning)', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t-secondary)', marginBottom: 8 }}>⚠ Compliance Alerts</div>
          {[...tdsAlerts, ...gstAlerts].map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--t-secondary)', marginBottom: 4 }}>• {a.title} — {a.sub}</div>
          ))}
        </div>
      )}
    </div>
  );
}
