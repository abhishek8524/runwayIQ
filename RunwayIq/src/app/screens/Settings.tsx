import { Toggle } from '../components/Toggle';
import { useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { id: 'profile', label: 'Business Profile' },
  { id: 'alerts', label: 'Alert Thresholds' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'team', label: 'Team & Access' },
  { id: 'danger', label: 'Danger Zone', isDanger: true },
];

export function Settings() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [runwayAlert, setRunwayAlert] = useState(true);
  const [burnAlert, setBurnAlert] = useState(true);
  const [cashAlert, setCashAlert] = useState(false);
  const [revenueAlert, setRevenueAlert] = useState(true);

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-[20px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
            Settings
          </div>
          <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
            {user?.email ?? 'Manage your account and preferences'}
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-md text-[11px] hover:bg-[#F9FAFB] transition-colors"
          style={{ color: '#374151' }}
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Left Navigation */}
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.isDanger && (
                  <div className="my-2 border-t border-[#E5E7EB]" />
                )}
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors ${
                    item.isDanger ? 'text-[#E24B4A]' : ''
                  }`}
                  style={{
                    backgroundColor: activeSection === item.id && !item.isDanger ? '#F0F4FF' : 'transparent',
                    borderLeft: activeSection === item.id && !item.isDanger ? '2px solid #1A56DB' : '2px solid transparent',
                    color: item.isDanger ? '#E24B4A' : activeSection === item.id ? '#1A56DB' : '#374151',
                    fontWeight: activeSection === item.id ? 500 : 400,
                    paddingLeft: activeSection === item.id && !item.isDanger ? '11px' : '12px'
                  }}
                >
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-4">
          {activeSection === 'profile' && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="text-[14px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
                  Business Profile
                </div>
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                  Update your company information
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] mb-1.5" style={{ color: '#374151', fontWeight: 500 }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Acme Corp"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
                    style={{ color: '#374151' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] mb-1.5" style={{ color: '#374151', fontWeight: 500 }}>
                    Industry
                  </label>
                  <input
                    type="text"
                    defaultValue="B2B SaaS"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
                    style={{ color: '#374151' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] mb-1.5" style={{ color: '#374151', fontWeight: 500 }}>
                    Fiscal Year Start
                  </label>
                  <input
                    type="text"
                    defaultValue="January"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
                    style={{ color: '#374151' }}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    className="px-4 py-2 rounded-md text-white text-[11px]"
                    style={{ backgroundColor: '#1A56DB', fontWeight: 500 }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'alerts' && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="text-[14px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
                  Alert Thresholds
                </div>
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                  Configure notifications for financial metrics
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
                  <div>
                    <div className="text-[12px] mb-0.5" style={{ color: '#374151', fontWeight: 500 }}>
                      Runway Alert
                    </div>
                    <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                      Notify when runway falls below 3 months
                    </div>
                  </div>
                  <Toggle checked={runwayAlert} onChange={setRunwayAlert} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
                  <div>
                    <div className="text-[12px] mb-0.5" style={{ color: '#374151', fontWeight: 500 }}>
                      Burn Rate Spike
                    </div>
                    <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                      Alert on burn increase &gt; 15% month-over-month
                    </div>
                  </div>
                  <Toggle checked={burnAlert} onChange={setBurnAlert} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
                  <div>
                    <div className="text-[12px] mb-0.5" style={{ color: '#374151', fontWeight: 500 }}>
                      Cash Threshold
                    </div>
                    <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                      Notify when cash drops below $100K
                    </div>
                  </div>
                  <Toggle checked={cashAlert} onChange={setCashAlert} />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-[12px] mb-0.5" style={{ color: '#374151', fontWeight: 500 }}>
                      Revenue Milestone
                    </div>
                    <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                      Celebrate when MRR hits growth targets
                    </div>
                  </div>
                  <Toggle checked={revenueAlert} onChange={setRevenueAlert} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="text-[14px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
                  Integrations
                </div>
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                  Connect your financial tools
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#635BFF] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>
                      S
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: '#374151', fontWeight: 500 }}>
                        Stripe
                      </div>
                      <div className="text-[9px]" style={{ color: '#059669' }}>
                        Connected
                      </div>
                    </div>
                  </div>
                  <button className="text-[10px] px-3 py-1 border border-[#E5E7EB] rounded-md" style={{ color: '#374151' }}>
                    Configure
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#00A4EF] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>
                      QBO
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: '#374151', fontWeight: 500 }}>
                        QuickBooks
                      </div>
                      <div className="text-[9px]" style={{ color: '#9CA3AF' }}>
                        Not connected
                      </div>
                    </div>
                  </div>
                  <button className="text-[10px] px-3 py-1 rounded-md text-white" style={{ backgroundColor: '#1A56DB' }}>
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'team' && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="text-[14px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
                  Team & Access
                </div>
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                  Manage team members and permissions
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-[11px]" style={{ fontWeight: 600 }}>
                      JD
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: '#374151', fontWeight: 500 }}>
                        John Doe
                      </div>
                      <div className="text-[9px]" style={{ color: '#9CA3AF' }}>
                        john@acme.com • Admin
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center text-white text-[11px]" style={{ fontWeight: 600 }}>
                      JS
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: '#374151', fontWeight: 500 }}>
                        Jane Smith
                      </div>
                      <div className="text-[9px]" style={{ color: '#9CA3AF' }}>
                        jane@acme.com • Viewer
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  className="w-full py-2 border border-[#E5E7EB] rounded-md text-[11px]"
                  style={{ color: '#1A56DB', fontWeight: 500 }}
                >
                  + Invite Team Member
                </button>
              </div>
            </div>
          )}

          {activeSection === 'danger' && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: '#E24B4A' }} />
                  <div className="text-[14px]" style={{ color: '#E24B4A', fontWeight: 500 }}>
                    Danger Zone
                  </div>
                </div>
                <div className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                  Irreversible and destructive actions
                </div>
              </div>

              <div className="p-4 border border-[#FCA5A5] rounded-md" style={{ backgroundColor: '#FFF5F5' }}>
                <div className="mb-3">
                  <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
                    Delete Account
                  </div>
                  <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                    Permanently delete your RunwayIQ account and all associated data. 
                    This action cannot be undone.
                  </div>
                </div>

                <button 
                  className="px-4 py-2 rounded-md text-[11px]"
                  style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 500 }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
