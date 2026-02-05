'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicAPI } from '@/lib/api';
import { Provider } from '@/types';

export default function ProvidersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredProviders(providers);
    } else {
      setFilteredProviders(
        providers.filter((p) => p.provider_type === selectedType)
      );
    }
  }, [selectedType, providers]);

  const fetchProviders = async () => {
    try {
      const response = await publicAPI.getProviders();
      setProviders(response.data);
      setFilteredProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  if (loading || loadingProviders) {
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
            <Link href="/user/dashboard" className="text-xl font-bold">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Service Providers
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-md ${
                  selectedType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('doctor')}
                className={`px-4 py-2 rounded-md ${
                  selectedType === 'doctor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Doctors
              </button>
              <button
                onClick={() => setSelectedType('salon')}
                className={`px-4 py-2 rounded-md ${
                  selectedType === 'salon'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Salons
              </button>
              <button
                onClick={() => setSelectedType('car-rental')}
                className={`px-4 py-2 rounded-md ${
                  selectedType === 'car-rental'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Car Rentals
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {provider.name}
                    </h3>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {provider.provider_type}
                    </span>
                  </div>
                  {provider.bio && (
                    <p className="text-sm text-gray-500 mb-4">{provider.bio}</p>
                  )}
                  <Link
                    href={`/user/providers/${provider.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full justify-center"
                  >
                    View Services & Book
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No providers found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}