import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import SearchField from '@admin/Transfers/Search';
import Filter from '@admin/Transfers/Filter';
import {
  TransferListTable,
} from '@admin/Transfers/TransferList';
import Form from 'react-bootstrap/esm/Form';
import ButtonToolbar from 'react-bootstrap/esm/ButtonToolbar';
import Button from 'react-bootstrap/esm/Button';
import InputGroup from 'react-bootstrap/esm/InputGroup';
import '@client/css/Admin.css';
import {
  DocumentStage, OperationType, RequestStatus,
} from '@interfaces';
import Navbar from 'react-bootstrap/esm/Navbar';
import SearchIcon from '@mui/icons-material/Search';
import Spinner from 'react-bootstrap/Spinner';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Voided from '@mui/icons-material/NotInterested';
import Recurring from '@mui/icons-material/Cached';
import { OptionsButton } from '@client/js/components/OptionsButton';
import { Activity, transactionLabels } from '@client/js/labels';
import Refresh from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { EffectiveMonthFormat, RequestParams } from 'shared/api/admin.api';
import { DateTime } from 'luxon';
import {
  useRequestQueryContext,
} from './RequestParameters.Provider';
import { getManagers, useAccessLevelDirector } from '../../admin.store';
import { useTradesROI } from '../../trades.store';

const defaultFilters: {
  name: keyof RequestParams,
  enum: { [key: string]: string },
  icons?: { [key: string]: JSX.Element },
  type?: 'radio'|'checkbox',
  label?: string
}[] = [
  {
    name: 'status',
    enum: RequestStatus,
    icons: {
      [RequestStatus.Pending]: <HourglassEmptyIcon/>,
      [RequestStatus.Approved]: <CheckCircleIcon/>,
      [RequestStatus.Declined]: <Voided/>,
      [RequestStatus.Recurring]: <Recurring/>,
    },
    type: 'checkbox',
  },
  { name: 'type', enum: OperationType, type: 'radio' },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
];

const component = (props: { path: string }) => {
  const { path } = props;
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    requestParameters, commitParameters: commit, busy, setParameter, pendingChanges, refresh,
  } = useRequestQueryContext();
  const { managers } = getManagers();
  const AccessLevelDirector = useAccessLevelDirector();
  let filters = defaultFilters;
  if (managers?.length && AccessLevelDirector) {
    filters = [
      ...filters,
      {
        name: 'fmId',
        enum: managers.reduce((acc, manager) => ({ ...acc, [manager.displayName]: manager.id }), {}),
        label: transactionLabels.manager,
      },
    ];
  }
  const { tradeMonths } = useTradesROI();
  const { year: startYear } = tradeMonths?.sort((a, b) => {
    const dateA = DateTime.fromObject({ month: a.month, year: a.year });
    const dateB = DateTime.fromObject({ month: b.month, year: b.year });
    return dateA.valueOf() > dateB.valueOf() ? 1 : -1;
  })[0] || { year: DateTime.local().year };
  const numberOfMonths = Math.abs(DateTime.fromObject({ year: startYear - 1, month: 12 }).diffNow('months').months);
  const availableMonths = Array.from({ length: numberOfMonths }, (_, i) => {
    const month = (i % 12) + 1;
    const year = Math.floor(i / 12) + startYear;
    return { month, year };
  });
  filters = [
    ...filters,
    {
      name: 'effectiveMonth',
      enum: availableMonths
        .sort((a, b) => (DateTime.fromObject({ month: a.month, year: a.year }).valueOf() > DateTime.fromObject({ month: b.month, year: b.year }).valueOf() ? -1 : 1))
        .reduce((acc, { month, year }) => {
          const date = DateTime.fromObject({ month, year });
          return ({ ...acc, [date.toFormat('MMM yyyy')]: date.toFormat(EffectiveMonthFormat) });
        }, {}),
      label: transactionLabels.month,
    },
    { name: 'stage', enum: DocumentStage, label: Activity.Progress },
  ];
  const { search } = requestParameters;
  const searchIsProbablyAnId = !Number.isNaN(+search) && +search > 0 && +search < 10000;
  const dirtyFilter = pendingChanges;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (searchIsProbablyAnId) {
      navigate(`../${path}/${search}`);
    } else {
      commit();
    }
  };

  return <Container fluid className='px-0'>
    <Row>
      <Col>
        <Form.Group className='mb-0'>
            <ButtonToolbar>
              <Form className='mb-0 w-100' onSubmit={handleSubmit} method='POST'>
              <Row className='g-0'>
                <Col className='pr-md-3 d-flex align-items-center'>
                  <InputGroup className='pe-0 ps-0 pb-2 col-12 w-100'>
                    <SearchField />
                    <OptionsButton
                      onClick={() => setFiltersOpen(!filtersOpen)}
                      expanded={filtersOpen}
                    />
                    {dirtyFilter
                      ? <Button
                        variant={searchIsProbablyAnId ? 'info' : 'primary'}
                        disabled={busy || !dirtyFilter} type='submit'>
                        {busy ? <Spinner size='sm' animation='grow' /> : <SearchIcon/>}
                      </Button>
                      : <Button onClick={refresh}>{busy ? <Spinner animation='grow' size='sm' /> : <Refresh />}</Button>
                    }
                  </InputGroup>
                </Col>
                <Navbar expanded={filtersOpen} expand='xl' as={Col} xl={8} className='p-0'>
                  <Navbar.Collapse as={Row}>
                    {filters.map((filter, idx) => (
                    <Col key={idx} xl='auto' className='ps-0 ps-lg-2 pb-2 pe-0 d-flex'>
                      <Filter {...{
                        Enum: filter.enum,
                        paramName: filter.name,
                        paramValue: requestParameters[filter.name],
                        setParamValue: setParameter,
                        enumIcons: filter.icons,
                        type: filter.type,
                        label: filter.label,
                        disabled: busy,
                      }} />
                    </Col>
                    ))}
                  </Navbar.Collapse>
                </Navbar>
              </Row>
            </Form>
          </ButtonToolbar>
        </Form.Group>
      </Col>
    </Row>
    <Row>
      <TransferListTable />
    </Row>
  </Container>;
};

export const TransferList = React.memo(component);
