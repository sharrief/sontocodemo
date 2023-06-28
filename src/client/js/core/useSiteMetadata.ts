import { API } from '@api';
import { SiteMetadata } from '@interfaces';
import { useState, useEffect } from 'react';

export default function useSiteMetadata() {
  const [siteMetadata, setSiteMetadata] = useState<SiteMetadata>({
    siteName: '',
    siteUrl: '',
    adminEmail: '',
    requestsDisabled: false,
  });
  useEffect(() => {
    if (!siteMetadata) {
      (async () => {
        const { siteMeta } = await API.Metadata.Site.get();
        setSiteMetadata(siteMeta);
      })();
    }
  }, []);
  return siteMetadata;
}
