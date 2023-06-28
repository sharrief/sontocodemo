import ResponsiveModal from '@client/js/components/Modal';
import MultiSelector from '@components/MultiSelector';
import { IManager } from '@interfaces';
import React, { useEffect, useState } from 'react';
import { ActiveAccountsFilter as Labels } from '@labels';
import { Button, Col, Row } from 'react-bootstrap';
import FilterList from '@mui/icons-material/FilterList';

const ActiveAccountsTableFilter = ({
  managers,
  selectedManagerIds,
  setSelectedManagerIds,
}: {
  managers: IManager[];
  selectedManagerIds: number[];
  setSelectedManagerIds: (ids: number[]) => void;
}) => {
  const options = managers.map((manager) => ({
    label: manager.displayName,
    id: manager.id,
  }));
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    if (selectedManagerIds?.length) {
      setIds(selectedManagerIds);
    }
  }, [selectedManagerIds]);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleOpen = () => setShow(true);
  const applySelection = () => {
    setSelectedManagerIds(ids);
    handleClose();
  };
  const enabled = JSON.stringify(ids.sort()) !== JSON.stringify(selectedManagerIds.sort());
  return (
    <>
    <ResponsiveModal
      show={show}
      handleClose={handleClose}
      header={<span className='fs-5'>{Labels.FilterAccounts}</span>}
      body={<MultiSelector
        options={options}
        selectedIds={ids}
        setSelectedIds={setIds}
      />}
      footer={<Row className='w-100 m-0 justify-content-between' style={{ height: '50px' }}>
        <Col xs='auto'>
          <Button
            onClick={handleClose}
            variant='secondary'
            >
            {Labels.Cancel}
          </Button>
        </Col>
        <Col xs='auto'>
          <Button
            onClick={applySelection}
            variant='primary'
            disabled={!enabled}
            >
            {Labels.Apply}
          </Button>
        </Col>
      </Row>}
    />
    <Button onClick={handleOpen}><span><FilterList/></span> <span className='d-none d-lg-inline'>{Labels.Filter}</span></Button>
    </>
  );
};

export default React.memo(ActiveAccountsTableFilter);
