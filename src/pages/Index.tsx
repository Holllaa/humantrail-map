
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // We're now rendering Dashboard directly, but this ensures backward compatibility
    // with any existing links to the /index route
    navigate('/', { replace: true });
  }, [navigate]);

  return <Dashboard />;
};

export default Index;
