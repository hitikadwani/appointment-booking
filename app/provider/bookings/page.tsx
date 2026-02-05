'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { providerAPI } from '@/lib/api';
import { Appointment } from '@/types';

export default function ProviderBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await providerAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await providerAPI.updateBookingStatus(id, status);
      fetchBookings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter((apt) => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  if (loading || loadingBookings) {
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
            <Link href="/provider/dashboard" className="text-xl font-bold">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Manage Bookings
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'confirmed'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white shadow rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.service_name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        User: {booking.user_name} ({booking.user_email})
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Date:{' '}
                        {new Date(
                          booking.appointment_date
                        ).toLocaleDateString()}{' '}
                        at {booking.appointment_time}
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-gray-500 mt-2">
                          Notes: {booking.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, 'confirmed')
                          }
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, 'cancelled')
                          }
                          className="px-4 py-2 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, 'completed')
                          }
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, 'cancelled')
                          }
                          className="px-4 py-2 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}