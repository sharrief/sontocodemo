import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { Activity } from '@labels';
import { useRequestQueryContext } from './TransferList/RequestParameters.Provider';

function SearchField({
  disableSearch,
}: {
  disableSearch?: boolean;
}) {
  const {
    requestParameters,
    setParameter,
    busy: transfersLoading,
    meta: { totalCount },
  } = useRequestQueryContext();
  const updateSearchParam = (value: string) => setParameter('search', value);
  const [search, setSearchState] = useState('');
  useEffect(() => {
    if (requestParameters.search === null || requestParameters.search === undefined) return;
    setSearchState(requestParameters.search);
  }, [requestParameters]);

  return (
      <Form.Control
      hidden={disableSearch}
      name='search'
      id='globalFilter'
      value={search}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        updateSearchParam(e.target.value);
      }}
      placeholder={transfersLoading ? Activity.Loading : Activity.SearchAcross(totalCount)}
      />
  );
}
export default React.memo(SearchField) as typeof SearchField;
