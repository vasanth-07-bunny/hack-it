import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle,
  X,
  Sparkles,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { useSocket } from '../../contexts/SocketContext';

interface PublicRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered?: (newUserId: string) => void;
}

export const PublicRegisterModal: React.FC<PublicRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegistered
}) => {
  const { event } = useEvent();
  const { refreshUsers, switchUser } = useAuth();
  const { playChime } = useSocket();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeOrCompany, setCollegeOrCompany] = useState('');
  const [skills, setSkills] = useState('React, TypeScript, TailwindCSS');
  const [preferredRole, setPreferredRole] = useState('Frontend Engineer');
  const [tShirtSize, setTShirtSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');
  const [dietaryRequirements, setDietaryRequirements] = useState('None');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const eventId = 'ev-abhiyantrix-2026';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          collegeOrCompany,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          preferredRole,
          tShirtSize,
          dietaryRequirements
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData(data);
        playChime('checkin');
        await refreshUsers();
        if (data.user?.id) {
          switchUser(data.user.id);
          if (onRegistered) onRegistered(data.user.id);
        }
      }
    } catch (err) {
      console.error('Registration failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-extrabold text-white text-base">Attendee Event Registration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!successData ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  required
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@example.com"
                  required
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">University / Organization</label>
              <input
                type="text"
                value={collegeOrCompany}
                onChange={(e) => setCollegeOrCompany(e.target.value)}
                placeholder="e.g. UC Berkeley / Independent"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Primary Role</label>
                <input
                  type="text"
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  placeholder="e.g. AI Engineer, UI/UX"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Key Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Python, PyTorch, React"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">T-Shirt Size</label>
                <select
                  value={tShirtSize}
                  onChange={(e: any) => setTShirtSize(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                  <option value="XXL">2XL</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Dietary Preference</label>
                <input
                  type="text"
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  placeholder="e.g. Vegetarian, Halal, None"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110"
              >
                {isSubmitting ? 'Registering...' : 'Complete & Generate QR'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-white">Registration Confirmed!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Your cryptographic signed QR Pass has been issued for <strong>{successData.user?.fullName}</strong>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg"
            >
              View My Digital Pass
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
