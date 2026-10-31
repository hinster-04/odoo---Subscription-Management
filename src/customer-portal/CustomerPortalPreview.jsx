import React, { useState, useEffect } from 'react';
import { CustomerPortalLayout } from './CustomerPortalLayout';

/**
 * Self-contained preview entry point.
 * Allows the customer portal to be rendered and previewed independently
 * without needing any alterations to the existing App.jsx router.
 */
export default function CustomerPortalPreview({ initialPath = '/portal/dashboard' }) {
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname.replace(/\/+$/, '') || '';
    return path.startsWith('/portal') ? path : initialPath;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '';
      if (path.startsWith('/portal')) {
        setCurrentPath(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (toPath) => {
    window.history.pushState({}, '', toPath);
    setCurrentPath(toPath.replace(/\/+$/, '') || '/portal/dashboard');
    window.scrollTo(0, 0);
  };

  return <CustomerPortalLayout currentPath={currentPath} onNavigate={navigate} />;
}
