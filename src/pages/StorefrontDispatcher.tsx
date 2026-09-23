import React from 'react';
import { useParams } from 'react-router-dom';
import PublicStoreFrontSupplier from './PublicStoreFront';
import PublicStorefrontReseller from '@/features/reseller/pages/PublicStorefront';

const StorefrontDispatcher: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();

  // A supplier store either is an ObjectId or ends with a 24-character hex ObjectId
  const isSupplier = /[0-9a-fA-F]{24}$/.test(idOrSlug || '');

  if (isSupplier) {
    return <PublicStoreFrontSupplier />;
  } else {
    return <PublicStorefrontReseller />;
  }
};

export default StorefrontDispatcher;
