import { fetchRoute } from '@api';
import { IUser, IApplication } from '@interfaces';
import { NestedValidations } from '@validation';

const path = '/api/applications';
export const Applications = {
  Create: {
    Route: `${path}/create`,
    async post(body: {
      email: IApplication['authEmail'];
      name: string;
      fmId: IUser['id'];
      documentLink?: IApplication['documentLink'];
    }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string };
    },
  },
  OpenAccount: {
    Route: `${path}/openAccount`,
    async post(body: {
      uuid: IApplication['uuid'];
      month: number;
      year: number;
      managerId?: number;
    }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string };
    },
  },
  Delete: {
    Route: `${path}/delete`,
    async post(body: {
      uuid: IApplication['uuid'];
    }) {
      return await fetchRoute(this.Route, body) as { success: boolean; message?: string; error?: string};
    },
  },
  List: {
    Route: `${path}/list`,
    async get() {
      return await fetchRoute(this.Route) as { applications?: ({name: string} & Pick<IApplication, 'id'|'uuid'|'fmId'|'authEmail'|'appPIN'|'Started'|'dateCreated'|'dateEnded'|'userId'>)[]; error?: string };
    },
  },
  View: {
    Route: `${path}/view`,
    async post(body: {
      uuid: IApplication['uuid'];
    }) {
      return await fetchRoute(this.Route, body) as { application?: IApplication; error?: string };
    },
  },
  Load: {
    Route: `${path}/load`,
    async get() {
      return await fetchRoute(this.Route) as {
        application?: IApplication;
        validationMessages?: NestedValidations<IApplication>;
        error?: string;
      };
    },
    async post(body: {
      authEmail: IApplication['authEmail'];
      appPIN: IApplication['appPIN'];
      hash?: string;
    }) {
      return await fetchRoute(this.Route, body) as {
        application?: IApplication;
        validationMessages?: NestedValidations<IApplication>;
        error?: string;
      };
    },
  },
  Save: {
    Route: `${path}/save`,
    async post(body: { application: IApplication }) {
      return await fetchRoute(this.Route, body) as {
        validationMessages?: NestedValidations<IApplication>;
        application?: IApplication;
        error?: string; };
    },
  },
};
