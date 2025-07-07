'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/utils/shopify';
import { useLocalStorage, User } from '@/hooks/useLocalStorage';
import Tabs from '@/components/ui/Tabs';

export default function Profile() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { storedData, updateStoredData, isExpired } = useLocalStorage();
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const [user, setUser] = useState<User | null>(storedData?.user || null);
  const [loading, setLoading] = useState(!storedData?.user);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<User | null>(user);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    mountedRef.current = true;

    async function fetchUserData() {
      if (fetchingRef.current || initialLoadDoneRef.current) return;
      
      if (!isExpired && storedData?.user) {
        setUser(storedData.user);
        setLoading(false);
        initialLoadDoneRef.current = true;
        return;
      }

      fetchingRef.current = true;

      try {
        const userResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`);
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();

        if (mountedRef.current) {
          setUser(userData);
          updateStoredData({ user: userData });
          setError('');
        }
      } catch (err) {
        console.error('Profile error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load profile data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          initialLoadDoneRef.current = true;
        }
        fetchingRef.current = false;
      }
    }

    fetchUserData();

    return () => {
      mountedRef.current = false;
    };
  }, [authFetch, router, isExpired]);

  useEffect(() => {
    setEditUser(user);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editUser) return;
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      // Replace with actual API call
      await new Promise(res => setTimeout(res, 800));
      setUser(editUser);
      setSaveMsg('Saved!');
    } catch {
      setSaveMsg('Failed to save.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  const accountTab = (
    <div className="flex justify-center w-full">
      <form className="space-y-6 max-w-xl w-full">
        <div>
          <label className="block text-base font-bold text-white mb-1">Name</label>
          <div className="text-sm text-[#A0A0A0] mb-1">The name associated with this account</div>
          <div className="flex gap-3 w-full">
            <input
              className="w-1/2 rounded-lg bg-[#232425] text-white px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8C74FF] font-medium"
              name="first_name"
              value={editUser?.first_name || ''}
              onChange={handleInputChange}
              placeholder="First Name"
            />
            <input
              className="w-1/2 rounded-lg bg-[#232425] text-white px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8C74FF] font-medium"
              name="last_name"
              value={editUser?.last_name || ''}
              onChange={handleInputChange}
              placeholder="Last Name"
            />
          </div>
        </div>
        <div>
          <label className="block text-base font-bold text-white mb-1">Email address</label>
          <div className="text-sm text-[#A0A0A0] mb-1">The email address associated with this account</div>
          <input
            className="w-full rounded-lg bg-[#232425] text-white px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8C74FF] font-medium"
            name="email"
            value={editUser?.email || ''}
            onChange={handleInputChange}
            placeholder="Email"
          />
        </div>
        <div>
          <label className="block text-base font-bold text-white mb-1">Phone number</label>
          <div className="text-sm text-[#A0A0A0] mb-1">The phone number associated with this account</div>
          <input
            className="w-full rounded-lg bg-[#232425] text-white px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8C74FF] font-medium"
            name="phone"
            value={editUser?.phone || ''}
            onChange={handleInputChange}
            placeholder="Phone number"
          />
        </div>
        <div>
          <label className="block text-base font-bold text-white mb-1">TimeZone</label>
          <div className="text-sm text-[#A0A0A0] mb-1">The timezone for your account</div>
          <select
            className="w-full rounded-lg bg-[#232425] text-white px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8C74FF] font-medium"
            name="timezone"
            value={editUser?.timezone || 'UTC'}
            onChange={handleInputChange}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </div>
        <div className="flex justify-center pt-0">
          <button
            type="button"
            className="px-8 py-2 rounded-lg bg-[#A3AFFF] text-[#232425] font-semibold hover:bg-[#8C74FF] hover:text-white transition-colors text-lg"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {saveMsg && <div className="text-green-400 mt-2 text-center">{saveMsg}</div>}
      </form>
    </div>
  );

  const placeholderTab = (label: string) => (
    <div className="text-gray-400 text-lg py-12 text-center">{label} settings coming soon.</div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-xl text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#141718] pt-0 px-2 sm:px-4 md:px-8 lg:px-10 font-inter overflow-x-hidden">
      <div className="w-full px-0">
        <h1 className="text-2xl sm:text-3xl md:text-[35px] text-white font-light mb-2 mt-0">
          Settings
        </h1>
        <div className="mb-10" />
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}
        <div className="pb-16">
          <Tabs
            tabs={[
              { label: 'Account', content: accountTab },
              { label: 'Billing', content: placeholderTab('Billing') },
              { label: 'Integrations', content: placeholderTab('Integrations') },
              { label: 'Members', content: placeholderTab('Members') },
              { label: 'Appearance', content: placeholderTab('Appearance') },
            ]}
          />
        </div>
      </div>
    </div>
  );
} 