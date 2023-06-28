import React, { useState } from 'react';
import ListGroup from 'react-bootstrap/esm/ListGroup';
import Button from 'react-bootstrap/esm/Button';
import ButtonGroup from 'react-bootstrap/esm/ButtonGroup';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/esm/Col';
import InputGroup from 'react-bootstrap/esm/InputGroup';
import FormControl from 'react-bootstrap/esm/FormControl';
import Modal from 'react-bootstrap/Modal';
import CheckCircle from '@mui/icons-material/CheckCircle';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import { MultiSelector as labels } from '@labels';
import { Form, ModalBody } from 'react-bootstrap';

const multiSelector = ({
  options, selectedIds, setSelectedIds, row, asDialog, hideFilter, buttons, pluralLabel,
}: {
  options: {id: number; label: string }[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  row?: boolean;
  asDialog?: boolean;
  hideFilter?: boolean;
  buttons?: boolean;
  pluralLabel?: string;
  } = {
  options: null, selectedIds: null, setSelectedIds: null, row: false, asDialog: false, hideFilter: true, buttons: false,
}) => {
  const [filterString, setFilterString] = useState('');
  const handleFilterStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterString(e.target.value);
  };
  const toggleSelectedId = (selectedIdString: string) => {
    const selectedId = +selectedIdString;
    if (selectedIds.includes(selectedId)) {
      setSelectedIds(selectedIds.filter((id) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, selectedId]);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const handleHideModal = () => { setShowModal(false); setFilterString(''); };
  const selectAll = () => setSelectedIds(options.map(({ id }) => id));
  const selectNone = () => setSelectedIds([]);
  const toolbar = (
    <InputGroup>

        <Button
          variant='outline-primary'
          active={options.reduce((a, { id }) => (selectedIds.includes(id) ? a : false), true)}
          onClick={selectAll}
        >{labels.All}
        </Button>
        <Button
          variant='outline-primary'
          active={selectedIds.length === 0}
          onClick={selectNone}
        >{labels.Clear}
        </Button>

      <FormControl
        value={filterString}
        onChange={handleFilterStringChange}
      />

        <InputGroup.Text>({selectedIds.length})</InputGroup.Text>

    </InputGroup>
  );

  const optionsList = buttons
    ? <ButtonGroup
          vertical={!row}
          className={row ? '' : 'mt-2'}
          style={row ? { maxWidth: '100%', overflowY: 'hidden', overflowX: 'scroll' } : { maxHeight: '500px', overflowX: 'hidden', overflowY: 'scroll' }}
        >
          {options
            .filter(({ label }) => label.toLowerCase().includes(filterString.toLowerCase()))
            .map(({ id, label }) => (
              <Button key={id} variant='outline-primary' active={selectedIds.includes(id)} onClick={() => toggleSelectedId(`${id}`)}>
                {label}
              </Button>
            ))}
        </ButtonGroup>
    : <ListGroup
        horizontal={row}
        className={row ? '' : 'mt-2'}
        style={row ? { maxWidth: '100%', overflowY: 'hidden', overflowX: 'scroll' } : { maxHeight: '500px', overflowX: 'hidden', overflowY: 'scroll' }}
        onSelect={toggleSelectedId}
      >
        {options
          .filter(({ label }) => label.toLowerCase().includes(filterString.toLowerCase()))
          .map(({ id, label }) => (
          <ListGroup.Item
            key={id}
            eventKey={`${id}`}
            action>
              <Row>
                <Col xs={2}>{selectedIds.includes(id) ? <CheckCircle /> : <RadioButtonUnchecked/>}</Col>
                <Col xs={10}>{label}</Col>
              </Row>
            </ListGroup.Item>
          ))}
      </ListGroup>;

  if (row) {
    return (<Row>
      {!hideFilter && <Col>{toolbar}</Col>}
      <Col>
        {optionsList}
      </Col>
    </Row>);
  }

  const selectorAsCol = <>
    {!hideFilter && <Row><Col>{toolbar}</Col></Row>}
    <Row><Col>{optionsList}</Col></Row>
  </>;

  return (<Row>
    <Col>
      <Modal show={showModal} onHide={handleHideModal}>
        <>
          <Modal.Header closeButton>
              {labels.SelectItems(pluralLabel ?? labels.Items)}
            </Modal.Header>
          <ModalBody>
            {selectorAsCol}
          </ModalBody>
        </>
      </Modal>
      <InputGroup className={asDialog ? '' : 'd-none'}>
        <Button onClick={() => setShowModal(true)}>{labels.SelectItems(pluralLabel ?? labels.Items)} ({selectedIds.length})</Button>
        <Form.Control
          readOnly
          value={options
            .filter(({ id }) => selectedIds.includes(id))
            .map(({ label }) => label)
            .join(', ')}
        />
      </InputGroup>
      {!asDialog && <div className='d-block'>
        {selectorAsCol}
      </div>}
    </Col>
  </Row>);
};
export default React.memo(multiSelector);
