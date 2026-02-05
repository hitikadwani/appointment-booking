'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { providerAPI } from '@/lib/api';
import { AvailabilitySlot } from '@/types';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AvailabilityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [slotForm, setSlotForm] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
  });
  const [blockForm, setBlockForm] = useState({
    blocked_date: '',
    reason: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user?.role !== 'provider') {
      router.push('/user/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'provider') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [slotsRes, blockedRes] = await Promise.all([
        providerAPI.getMyAvailability(),
        providerAPI.getBlockedDates(),
      ]);
      setSlots(slotsRes.data);
      setBlockedDates(blockedRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await providerAPI.addAvailability(slotForm);
      setSlotForm({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
      setShowSlotForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add slot:', error);
    }
  };

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await providerAPI.blockDate(blockForm);
      setBlockForm({ blocked_date: '', reason: '' });
      setShowBlockForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to block date:', error);
    }
  };

  const getDayName = (dayNum: number) => {
    return DAYS.find((d) => d.value === dayNum)?.label || 'Unknown';
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/provider/dashboard" className="text-xl font-bold text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Manage Availability
          </h2>

          {/* Weekly Availability */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Weekly Schedule
              </h3>
              <button
                onClick={() => setShowSlotForm(!showSlotForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showSlotForm ? 'Cancel' : '+ Add Time Slot'}
              </button>
            </div>

            {showSlotForm && (
              <form onSubmit={handleAddSlot} className="mb-6 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Day
                    </label>
                    <select
                      value={slotForm.day_of_week}
                      onChange={(e) =>
                        setSlotForm({
                          ...slotForm,
                          day_of_week: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slotForm.start_time}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, start_time: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slotForm.end_time}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, end_time: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Slot
                </button>
              </form>
            )}

            {slots.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No availability slots set. Add your working hours.
              </p>
            ) : (
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const daySlots = slots.filter((s) => s.day_of_week === day.value);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={day.value} className="border-b pb-2">
                      <h4 className="font-medium text-gray-900">{day.label}</h4>
                      <div className="ml-4 space-y-1">
                        {daySlots.map((slot) => (
                          <p key={slot.id} className="text-sm text-gray-600">
                            {slot.start_time} - {slot.end_time}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocked Dates */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Blocked Dates (Holidays/Days Off)
              </h3>
              <button
                onClick={() => setShowBlockForm(!showBlockForm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {showBlockForm ? 'Cancel' : '+ Block Date'}
              </button>
            </div>

            {showBlockForm && (
              <form onSubmit={handleBlockDate} className="mb-6 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={blockForm.blocked_date}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, blocked_date: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={blockForm.reason}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, reason: e.target.value })
                      }
                      placeholder="Holiday, Vacation, etc."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Block Date
                </button>
              </form>
            )}

            {blockedDates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No blocked dates.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {blockedDates.map((blocked) => (
                  <li key={blocked.id} className="py-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(blocked.blocked_date).toLocaleDateString()}
                      </p>
                      {blocked.reason && (
                        <p className="text-sm text-gray-500">{blocked.reason}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}