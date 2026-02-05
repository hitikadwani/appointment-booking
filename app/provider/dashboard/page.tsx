'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { providerAPI } from '@/lib/api';
import { Appointment, Service } from '@/types';

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
      const [bookingsRes, servicesRes] = await Promise.all([
        providerAPI.getMyBookings(),
        providerAPI.getMyServices(),
      ]);
      setBookings(bookingsRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingData(false);
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Provider Dashboard</h1>
            <div className="flex gap-4">
              <Link
                href="/provider/services"
                className="text-blue-600 hover:text-blue-800"
              >
                Services
              </Link>
              <Link
                href="/provider/availability"
                className="text-blue-600 hover:text-blue-800"
              >
                Availability
              </Link>
              <Link
                href="/provider/bookings"
                className="text-blue-600 hover:text-blue-800"
              >
                Bookings
              </Link>
              <Link href="/login" className="text-red-600 hover:text-red-800">Logout</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {user?.name}!
            </h2>
            <p className="text-gray-600">
              Provider Type: <span className="font-medium capitalize">{user?.provider_type}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Bookings
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {bookings.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending
                      </dt>
                      <dd className="text-3xl font-semibold text-yellow-600">
                        {pendingBookings.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Confirmed
                      </dt>
                      <dd className="text-3xl font-semibold text-green-600">
                        {confirmedBookings.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Services
                      </dt>
                      <dd className="text-3xl font-semibold text-blue-600">
                        {services.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingBookings.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Pending Requests
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {pendingBookings.map((booking) => (
                    <li key={booking.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.service_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            User: {booking.user_name} ({booking.user_email})
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.appointment_date).toLocaleDateString()} at{' '}
                            {booking.appointment_time}
                          </p>
                        </div>
                        <Link
                          href="/provider/bookings"
                          className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          Review
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Bookings
              </h3>
            </div>
            <div className="border-t border-gray-200">
              {bookings.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">
                  No bookings yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {bookings.slice(0, 5).map((booking) => (
                    <li key={booking.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.service_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            User: {booking.user_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.appointment_date).toLocaleDateString()} at{' '}
                            {booking.appointment_time}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}