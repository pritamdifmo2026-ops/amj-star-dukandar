import React from 'react';
import { useParams } from 'react-router-dom';
import PublicStoreFrontSupplier from './PublicStoreFront';
import PublicStorefrontReseller from '@/features/reseller/pages/PublicStorefront';

const StorefrontDispatcher: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();

  // A MongoDB ObjectId is a 24-character hex string
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug || '');

  if (isObjectId) {
    return <PublicStoreFrontSupplier />;
  } else {
    return <PublicStorefrontReseller />;
  }
};

export default StorefrontDispatcher;
