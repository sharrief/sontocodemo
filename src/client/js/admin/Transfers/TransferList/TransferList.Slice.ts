/* eslint-disable no-param-reassign */
import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';
import { State } from './index';

export const DefaultState: State = {
  initialized: false,
  busy: false,
  pageIndex: 0,
  pageCount: 0,
  pageSize: 20,
  totalCount: 0,
  search: '',
  filters: {
    status: { type: 'checkbox', value: [''] },
    type: { type: 'radio', value: '' },
    stage: { type: 'radio', value: '' },
  },
  requestParams: {
    page: 0,
    limit: 20,
    search: '',
  },
  dirtyFilter: false,
};

export const Slice = createSlice({
  name: 'TransferListSlice',
  initialState: DefaultState,
  reducers: {
    inited: (state) => { state.initialized = true; },
    init: (state, { payload }: PayloadAction<Pick<State, 'search'|'pageIndex'|'pageSize'|'filters'>>) => {
      ({
        search: state.search,
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        filters: state.filters,
      } = payload);
    },
    moveToPageIndex: (state, { payload }: PayloadAction<State['pageIndex']>) => {
      state.pageIndex = payload;
    },
    setSearch: (state, { payload: search }: PayloadAction<State['search']>) => {
      state.search = search;
      state.dirtyFilter = true;
    },
    cleanFilter: (state) => { state.dirtyFilter = false; },
    clearSearch: (state) => { state.search = ''; },
    setFilter: (state, { payload: { filterName, filterUpdateState } }: PayloadAction<
      {
        filterName: string;
        filterUpdateState: ({ type: 'radio'; value: string}
        | { type: 'checkbox'; value: (string)[]});
      }>) => {
      const { value } = filterUpdateState;
      if (Array.isArray(value)) {
        if (value.indexOf('') === value.length - 1 || value.length === 0) {
          state.filters[filterName].value = [''];
        } else {
          state.filters[filterName].value = value.filter((v) => v !== '');
        }
      } else {
        state.filters[filterName].value = filterUpdateState.value;
      }
      state.dirtyFilter = true;
    },
    setPageSize: (state, { payload }: PayloadAction<State['pageSize']>) => {
      state.pageSize = payload;
      state.pageIndex = 0;
    },
    setPageIndex: (state, { payload }: PayloadAction<State['pageIndex']>) => {
      state.pageIndex = payload;
    },
    setQueryString: (state, { payload }: PayloadAction<State['requestParams']>) => {
      state.requestParams = payload;
      state.dirtyFilter = false;
    },
  },
});
