import React, { createContext, useContext, useState, useEffect } from 'react';
import { Event } from '@abhiyantrix/shared-types';
import { apiFetch } from '../services/api';

interface EventContextType {
  event: Event | null;
  isLoading: boolean;
  refreshEvent: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvent = async () => {
    try {
      const data: Event = await apiFetch('/api/events/ev-abhiyantrix-2026');
      if (data && data.id) {
        setEvent(data);
      }
    } catch (err) {
      console.error('Failed to fetch event data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  return (
    <EventContext.Provider value={{ event, isLoading, refreshEvent: fetchEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
