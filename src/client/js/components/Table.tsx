import React, { useState } from 'react';
import {
  useTable, Column, usePagination, useGlobalFilter,
} from 'react-table';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import { capitalizeFirstLetter } from '@helpers';
import { Table as TableLabels } from '@client/js/labels';
import Button from 'react-bootstrap/esm/Button';
import ExcelIcon from '@client/images/excel.svg';
import Image from 'react-bootstrap/esm/Image';
import ButtonGroup from 'react-bootstrap/esm/ButtonGroup';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import { Alert, Spinner } from 'react-bootstrap';
import { v4 } from 'uuid';
import { ThemeName } from '../store/state';

export type TableProps<T extends object> = {
  id: string;
  manualPagination: boolean;
  data: T[];
  itemLabelPlural: string;
  disableSearch?: boolean;
  columns: Column<T>[];
  rowClickHandler: (index: number) => void;
  cardHeaderColumns?: string[];
  cardLabels?: boolean;
  cardLabelSpacing?: 'close'|'just';
  hiddenColumnAccessors?: string[];
  initialPageIndex?: number;
  initialPageSize?: number;
  totalCount?: number;
  loading?: boolean;
  onPageIndexChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  currentPageCount?: number;
  currentPageSize?: number;
  currentPageIndex?: number;
  exportHandler?: () => void;
  theme?: ThemeName;
};

const Table = React.memo(function QTTable<T extends object>({
  id,
  manualPagination,
  data,
  columns,
  itemLabelPlural,
  disableSearch,
  cardHeaderColumns,
  cardLabels,
  cardLabelSpacing,
  hiddenColumnAccessors,
  initialPageIndex,
  initialPageSize,
  currentPageCount,
  currentPageSize,
  currentPageIndex,
  totalCount,
  loading,
  onPageIndexChange,
  onPageSizeChange,
  exportHandler,
  rowClickHandler,
  theme,
}: TableProps<T>) {
  const {
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    rows,
    setPageSize,
    state: tableState,
  } = useTable<T>({
    columns,
    data,
    initialState: {
      pageIndex: initialPageIndex ?? 0,
      pageSize: initialPageSize ?? 5,
      hiddenColumns: hiddenColumnAccessors ?? [],
    },
    manualPagination,
    pageCount: currentPageCount,
    pageSize: currentPageSize,
    pageIndex: currentPageIndex,
    disableGlobalFilter: disableSearch,
    autoResetFilters: false,
    autoResetPage: false,
    autoResetGlobalFilter: false,
  },
  useGlobalFilter,
  usePagination);

  const [tableId] = useState(id || v4());
  const pageSize = currentPageSize ?? tableState.pageSize;
  const pageIndex = currentPageIndex ?? tableState.pageIndex;

  const count = manualPagination ? totalCount : rows.length;

  const handlePageChange = (newPageIndex: number) => {
    gotoPage(newPageIndex);
    if (onPageIndexChange) onPageIndexChange(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    if (onPageSizeChange) onPageSizeChange(newPageSize);
  };

  const footer = !loading && <Row>
    <Col>
      <Row xs={12} className='mt-2'>
        <Col xs={12} md='auto'>
          <InputGroup className='pb-2 pb-md-0'>
            <InputGroup.Text>{capitalizeFirstLetter(TableLabels.Show)}</InputGroup.Text>
            <Form.Select
              disabled={loading}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const size = e.target.value ? Number(e.target.value) : null;
                handlePageSizeChange(size);
              }}
              value={pageSize}
            >
              <option value='5'>5</option>
              <option value='10'>10</option>
              <option value='20'>20</option>
              <option value='30'>30</option>
              <option value='40'>40</option>
              <option value='50'>50</option>
            </Form.Select>
            <InputGroup.Text>{`of ${count}`}</InputGroup.Text>
          </InputGroup>
        </Col>
        <Col xs={12} md='auto'>
          <InputGroup className='pb-2 pb-md-0'>
              <InputGroup.Text>{capitalizeFirstLetter(TableLabels.Page)}</InputGroup.Text>
            <Form.Select
              disabled={loading}
              value={pageIndex === null ? pageIndex : pageIndex + 1}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const newPageIndex = e.target.value ? Math.max(+(e.target.value) - 1, 0) : null;
                handlePageChange(newPageIndex);
              }}>
              {pageOptions.map((pageIndexOption) => (
                <option key={pageIndexOption + 1} value={pageIndexOption + 1}>{pageIndexOption + 1}</option>
              ))}
            </Form.Select>
              <InputGroup.Text>{`of ${pageCount}`}</InputGroup.Text>
          </InputGroup>
        </Col>
        <Col xs={12} md='auto' className='pb-2 pb-md-0'>
          <ButtonGroup className='w-100'>
            <Button variant='secondary' onClick={() => handlePageChange(0)} disabled={!canPreviousPage || loading}><FirstPage/></Button>
            <Button variant='secondary' onClick={() => handlePageChange(Math.max(0, pageIndex - 1))} disabled={!canPreviousPage || loading}><ChevronLeft /></Button>
            <Button variant='secondary' onClick={() => handlePageChange(Math.min(pageCount - 1, pageIndex + 1))} disabled={!canNextPage || loading}><ChevronRight/></Button>
            <Button variant='secondary' onClick={() => handlePageChange(pageCount - 1)} disabled={!canNextPage || loading}><LastPage/></Button>
          </ButtonGroup>
        </Col>
        {exportHandler && <Col xs='auto'>
          <Button disabled={loading} style={{
            backgroundColor: 'rgb(8,119,58)', height: '35px', width: '100px', display: 'flex', flexDirection: 'row',
          }} onClick={() => exportHandler()}><Image src={ExcelIcon} height={20} className='pe-2' />{TableLabels.Export}</Button>
        </Col>}
    </Row>
    </Col>
  </Row>;
  const gridTemplateColumns = `${columns
    .filter(({ accessor }) => !hiddenColumnAccessors?.includes(accessor as string))
    .map(() => 'minmax(50px, auto)').join('\n')}${rowClickHandler ? '\nminmax(10px,auto)' : ''}`;
  return (
    <Col>
      <Row className='g-0'>
        <Col className='d-none d-lg-flex'>
        <style>{`
        .table.${tableId} {
          display: grid;
          min-width: 100%;
          max-height: 100%;
          grid-template-columns: ${gridTemplateColumns};
          width: 100%;
          border-collapse: separate;
          text-indent: initial;
          white-space: normal;
          line-height: normal;
          font-weight: normal;
          font-size: medium;
          font-style: normal;
          color: -internal-quirk-inherit;
          text-align: start;
          border-spacing: 2px;
          font-variant: normal;
        }
        .table.${tableId} .td, .table.${tableId} .th {
          padding: .75rem;
          vertical-align: top;
          border-top: 1px solid #dfd7ca;
        }
        .table.${tableId} .thead .th {
          vertical-align: bottom;
          border-bottom: 2px solid #dfd7ca;
        }
        .table.${tableId} .thead {
          display: table-header-group;
          vertical-align: middle;
          border-color: inherit;
        }
        .table.${tableId} .th {
          display: table-cell;
          vertical-align: inherit;
          font-weight: bold;
          text-align: -internal-center;
        }
        .table.${tableId} .tr:nth-child(even) .td {
          background-color: rgba(0,0,0,.05);
        }
        .table.${tableId} .tr {
          cursor: ${rowClickHandler ? 'pointer' : ''};
        }    
        .table.${tableId} .tr:hover .td{
          background-color: rgba(0,0,0,.10);
        } 
        .table.${tableId} .thead,.table.${tableId} .tbody,.tr {
          display: contents;
        }
        `}</style>
          <div className={`table ${tableId}`}>
          <div className='thead'>
            {headerGroups.map((headerGroup, hi) => (
              <div className='tr' key={headerGroup.id || hi} >
                {headerGroup.headers.map((column, ci) => (
                  <div className='th' key={column.id || ci} >
                    {column.render('Header')}
                  </div>
                ))}
                {rowClickHandler && <div className='th align-middle'></div>}
              </div>
            ))}
          </div>
          <div className='tbody' {...getTableBodyProps()}>
            {page && page.map((pageRow, pi) => {
              prepareRow(pageRow);
              return (
                <div className='tr' key={pageRow.id || pi} onClick={() => rowClickHandler?.(pageRow.index)}>
                  {
                    pageRow.cells.map((cell, idx) => <div key={idx} className='td align-middle'>{cell.render('Cell')}</div>)
                  }
                {rowClickHandler && <div className='td align-middle text-right'> <ChevronRight /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </Col>
      <Col className='d-lg-none'>
        {cardHeaderColumns && page && page.map((pageRow) => (
          <Card key={pageRow.id} className='mb-2' border={(theme === 'vapor' || theme === 'darkly') ? 'info' : ''}>
            <Card.Header onClick={() => rowClickHandler?.(pageRow.index)}>
              <Row>
                <Col xs={true}>
                  <Row>
                  {pageRow.cells
                    .filter(({ column }) => cardHeaderColumns.includes(column.id))
                    .map((cell) => (
                      <Col className='pe-1' xs={true} key={cell.column.id}>{cell.render('Cell')}</Col>
                    ))}
                  </Row>
                </Col>
                { rowClickHandler && <Col xs='auto' className='d-flex justify-content-end'>
                  <div className='align-middle text-right'><ChevronRight /></div>
                </Col>}
              </Row>
              </Card.Header>
              {cardLabels
                ? <Card.Body>
                    <Container>
                        <Row>
                          <Col>
                            {pageRow.cells
                              .filter(({ column }) => !cardHeaderColumns.includes(column.id))
                              .map((cell) => (
                                <Row key={cell.column.id} className='align-items-center'>
                                  <Col xs={cardLabelSpacing === 'close' ? 'auto' : true}>{cell.column.render('Header')}</Col>
                                  <Col>{cell.render('Cell')}</Col>
                                </Row>
                              ))}
                        </Col>
                      </Row>
                    </Container>
                  </Card.Body>
                : <Card.Body>
                    <Container>
                        <Row>
                          <Col>
                            {pageRow.cells
                              .filter(({ column }, index) => index % 2 === 1 && !cardHeaderColumns.includes(column.id))
                              .map((cell) => (
                                <Row key={cell.column.id}><Col>{cell.render('Cell')}</Col></Row>
                              ))}
                        </Col>
                        <Col>
                            {pageRow.cells
                              .filter(({ column }, index) => index % 2 === 0 && !cardHeaderColumns.includes(column.id))
                              .map((cell) => (
                                <Row key={cell.column.id}><Col>{cell.render('Cell')}</Col></Row>
                              ))}
                        </Col>
                      </Row>
                    </Container>
                  </Card.Body>
              }
          </Card>
        ))}
      </Col>
    </Row>
    {loading && <Alert variant='secondary'>{TableLabels.Loading} {itemLabelPlural} <Spinner animation='grow' size='sm'/></Alert>}
    {footer}
  </Col>
  );
});

export default Table;
