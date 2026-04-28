import { useUser, useClerk } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Shield, Hash, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/resume-builder/dashboard');
  };

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}>
            <User size={16} className="text-white" />
          </div>
          Profile
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#4b5563' }}>Manage your account details</p>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rb-card mb-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-5 mb-6">
          {user.imageUrl ? (
            <img src={user.imageUrl}
                 className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                 alt="Profile avatar" />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white"
                 style={{ background: 'linear-gradient(135deg,#96e630,#c8f03e)' }}>
              {user.firstName?.[0] ?? '?'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{user.fullName || 'User'}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              {user.primaryEmailAddress?.emailAddress}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="rb-badge">Clerk Account</span>
              <span className="rb-badge-success rb-badge">Active</span>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2.5">
          {[
            { icon: Mail,     label: 'Email',        value: user.primaryEmailAddress?.emailAddress },
            { icon: Shield,   label: 'Account Status', value: 'Active & Verified', color: '#22c55e' },
            { icon: Calendar, label: 'Member Since',  value: joinDate },
            { icon: Hash,     label: 'User ID',       value: user.id, mono: true },
          ].map(({ icon: Icon, label, value, color, mono }) => (
            <div key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: 'rgba(150,230,48,0.12)' }}>
                <Icon size={14} className="text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: '#4b5563' }}>{label}</p>
                <p className={`text-sm font-medium truncate mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}
                   style={{ color: color ?? '#e2e8f0' }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="rb-card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={15} className="text-indigo-400" /> Account Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleSignOut}
            className="rb-btn-danger rb-btn w-full justify-center text-sm"
          >
            <LogOut size={15} /> Sign Out of Resume Builder
          </button>
          <p className="text-xs text-center" style={{ color: '#374151' }}>
            Your resumes and data will be kept safe
          </p>
        </div>
      </motion.div>
    </div>
  );
}
