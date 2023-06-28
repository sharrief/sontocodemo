import { fetchRoute } from '@api';
import { SiteMetadata } from '@interfaces';

const path = '/api/metadata';
export const Metadata = {
  Site: {
    Route: `${path}/site`,
    async get() {
      return await fetchRoute(this.Route) as { siteMeta?: SiteMetadata; error?: string };
    },
  },
};
