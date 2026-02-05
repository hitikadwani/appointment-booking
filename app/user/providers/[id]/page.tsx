'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { publicAPI, userAPI } from '@/lib/api';
import { Service } from '@/types';

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const providerId = Number(params.id);

  // Helper function to format date correctly (avoids timezone issues)
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchServices();
  }, [providerId]);

  useEffect(() => {
    if (selectedDate && providerId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, providerId]);

  const fetchServices = async () => {
    try {
      const response = await publicAPI.getProviderServices(providerId);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    // Clear selected time when fetching new slots
    setSelectedTime('');
    try {
      const dateStr = formatDateString(selectedDate);
      console.log('Fetching slots for:', dateStr, 'Day:', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedDate.getDay()]);
      
      const response = await publicAPI.getAvailableSlots(providerId, dateStr);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Please select service, date, and time');
      return;
    }

    setBooking(true);
    setError('');
    setSuccess('');

    try {
      const dateStr = formatDateString(selectedDate);
      
      await userAPI.createBooking({
        provider_id: providerId,
        service_id: selectedService.id,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        notes: notes || undefined,
      });
      setSuccess('Booking created successfully!');
      setTimeout(() => {
        router.push('/user/appointments');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatTime12Hour = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const previousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    // Don't allow going to past months
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (newMonth >= currentMonthStart) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const canGoPreviousMonth = () => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    return prevMonth >= currentMonthStart;
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading || loadingServices) {
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
            <Link href="/user/providers" className="text-xl font-bold text-gray-900">
              ← Back to Providers
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Book an Appointment
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Step 1: Select Service */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Step 1: Select a Service
            </h3>
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No services available from this provider.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      // Clear date and time when changing service
                      setSelectedDate(null);
                      setSelectedTime('');
                      setAvailableSlots([]);
                    }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {service.description}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ${service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 & 3: Calendar and Time Slots Side by Side */}
          {selectedService && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Step 2: Select Date & Time
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={previousMonth}
                        disabled={!canGoPreviousMonth()}
                        className={`p-2 rounded-full transition-all ${
                          canGoPreviousMonth() 
                            ? 'hover:bg-gray-100 text-gray-700 cursor-pointer' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={canGoPreviousMonth() ? 'Previous month' : 'Cannot go to past months'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h4>
                      </div>
                      <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-all"
                        title="Next month"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={goToToday}
                        className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                      >
                        Go to Today
                      </button>
                    </div>
                  </div>

                  {/* Week day headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth(currentMonth).map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }

                      const isSelected = isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      const isPast = isPastDate(day);

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (!isPast) {
                              setSelectedDate(day);
                              setSelectedTime('');
                            }
                          }}
                          disabled={isPast}
                          className={`
                            aspect-square rounded-full flex items-center justify-center text-sm font-medium
                            transition-all
                            ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                            ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                            ${isTodayDate && !isSelected ? 'border-2 border-blue-600 text-blue-600' : ''}
                            ${!isSelected && !isTodayDate && !isPast ? 'text-gray-700' : ''}
                          `}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {selectedDate ? 'Available Times' : 'Select a date first'}
                  </h4>
                  {selectedDate && (
                    <p className="text-xs text-gray-500 mb-4">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-gray-500">
                        <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading available times...
                      </div>
                    </div>
                  ) : !selectedDate ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Please select a date to see available times
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-600 font-medium mb-1">No available slots</p>
                      <p className="text-sm text-gray-500">
                        All time slots are booked for this date.<br />
                        Try selecting a different day.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`
                            w-full px-4 py-3 rounded-full text-sm font-medium transition-all
                            ${selectedTime === slot
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                            }
                          `}
                        >
                          {formatTime12Hour(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notes */}
          {selectedTime && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Additional Notes (Optional)
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requirements or notes..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
          )}

          {/* Booking Summary & Confirm */}
          {selectedTime && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Booking Summary
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Service:</dt>
                  <dd className="font-medium">{selectedService?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Date:</dt>
                  <dd className="font-medium">
                    {selectedDate?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Time:</dt>
                  <dd className="font-medium">{formatTime12Hour(selectedTime)}</dd>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <dt className="text-gray-600 text-lg">Total Price:</dt>
                  <dd className="font-bold text-xl text-blue-600">${selectedService?.price}</dd>
                </div>
              </dl>
              <button
                onClick={handleBooking}
                disabled={booking}
                className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}