import { AdminThunk } from '@admin/admin.store';
import { API } from '@api';
import { trimSearch } from '@util';
import { useLocation } from 'react-router-dom';
import { Slice as slice } from './index';

export const updateTransferListQuery: AdminThunk<never> = () => (dispatch, getState) => {
  const {
    transferList: {
      pageIndex: page,
      pageSize: limit,
      search: untrimmedSearch,
      filters: filterStates,
    },
  } = getState();
  const params = new URLSearchParams();
  let search = untrimmedSearch;
  if (search) {
    search = trimSearch(search);
    if (search) {
      dispatch(slice.actions.setSearch(search));
      params.set('search', search);
    } else {
      dispatch(slice.actions.clearSearch());
    }
  }
  if (page != null) params.set('page', `${page}`);
  if (limit != null) params.set('limit', `${limit}`);
  const filters: {[key: string]: string|string[]} = {};
  Object.keys(filterStates).forEach((key) => {
    const { value } = filterStates[key];
    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (val) {
          params.append(key, `${val}`);
          if (filters?.[key]) {
            filters[key] = [...filters?.[key], val];
          } else {
            filters[key] = [val];
          }
        }
      });
    } else if (value) {
      params.set(key, `${filterStates[key].value}`);
      filters[key] = value;
    }
  });

  // dispatch(push(`?${params.toString()}`)); // TODO Seems to cause page reload

  const requestParams: Parameters<typeof API.Admin.Requests.get>[0] = {
    page,
    limit,
    search,
    ...filters,
    // withUser: false,
    // withManager: false,
    // withDocuments: false,
    // withBankAccounts: false,
    // withOperations: false,
  };

  dispatch(slice.actions.setQueryString(requestParams));
};

export const initTransferListQuery: AdminThunk<never> = () => (dispatch, getState) => {
  const {
    transferList: {
      initialized, busy: loading, pageIndex, pageSize,
    },
  } = getState();
  if (initialized || loading) return;
  dispatch(slice.actions.inited());
  const location = useLocation();
  const query = location.search;
  const params = new URLSearchParams(query);
  const parameters: {[key: string]: string} = {};
  params.forEach((value, key) => {
    parameters[key] = value;
  });
  const {
    search, limit: l, page: p,
  } = parameters;
  const filterStates = getState().transferList.filters;
  const filters = Object.keys(filterStates)
    .reduce((all, key) => {
      const filterState = getState().transferList.filters[key];
      if (filterState.type === 'checkbox') {
        const paramFilterValues = params.getAll(key as string);
        if (paramFilterValues?.length) {
          return {
            ...all,
            [key]: {
              type: filterState.type,
              value: paramFilterValues,
            },
          };
        }
      } else {
        const paramFilterValue = params.get(key);
        if (paramFilterValue) {
          return {
            ...all,
            [key]: {
              type: filterState.type,
              value: paramFilterValue,
            },
          };
        }
      }
      return all;
    }, filterStates);

  const limit = Number.isNaN(+l) ? pageSize : +l;
  const page = Number.isNaN(+l) ? pageIndex : +p;
  dispatch(slice.actions.init({
    search: search ?? '', pageSize: limit, pageIndex: page, filters,
  }));
  dispatch(updateTransferListQuery());
};

export const handlePageIndexChanged: AdminThunk<{ newPageIndex: number } > = (args) => (dispatch, getState) => {
  const { newPageIndex } = args;
  if (newPageIndex !== getState().transferList.pageIndex) {
    dispatch(slice.actions.moveToPageIndex(newPageIndex));
  }
  dispatch(updateTransferListQuery());
};

export const handlePageSizeChanged: AdminThunk<{ newPageSize: number } > = (args) => (dispatch, getState) => {
  const { newPageSize } = args;
  if (newPageSize !== getState().transferList.pageSize) {
    dispatch(slice.actions.setPageSize(newPageSize));
  }
  dispatch(updateTransferListQuery());
};
