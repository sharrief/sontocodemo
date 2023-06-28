/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import React, { useEffect } from 'react';
import {
  useLocation, useNavigate, useResolvedPath,
} from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MobileStepper from '@material-ui/core/MobileStepper';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import Modal from 'react-bootstrap/Modal';
import SwipeableViews from 'react-swipeable-views';
import {
  Disclaimer, step2, step3, step4, step5, step6, step7, step8,
} from '@application/Steps';
import Labels from '@application/Labels';
import Logo from '@brand/images/logo-color.png';
import styled from 'styled-components';
import { StepNext, StepBack } from '@application/Fields';
import { useDispatch, useSelector } from 'react-redux';
import StepButton from '@material-ui/core/StepButton';
import Alert, { AlertProps } from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import {
  FetchStatus,
  RootState,
  StepName, StepNames,
} from '@application/application.store';
import {
  loadApplication, actions, clickedStepButton, exitAppSession, loadFromSession, loadById,
} from '@application/applicationForm.behavior';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { createSelector } from '@reduxjs/toolkit';
import ScrollToTop from 'react-scroll-up';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import '@css/Application.css';

const StyledStep = styled(Step)`
  .MuiStepIcon-root.MuiStepIcon-completed {
    color: #325D88
  }
  .MuiStepIcon-root.MuiStepIcon-active {
    color: rgb(236,188,30)
  }
`;
const StyledMobileStepper = styled(MobileStepper)`
.MuiMobileStepper-dotActive {
  background-color: rgb(236,188,30)
}
`;
const s = [Disclaimer.step1, step2, step3, step4, step5, step6, step7, step8];
const selectUI = createSelector(
  [(state: RootState) => {
    const {
      completedFirstLoad,
      numberOfSteps, currentStep, loadedApplication, fetchStatus, invalidFields, canStepNext, showErrorDialog, loginMessage, fetchError,
    } = state.uiState;
    return {
      completedFirstLoad, numberOfSteps, currentStep, loadedApplication, fetchStatus, invalidFields, canStepNext, showErrorDialog, loginMessage, fetchError,
    };
  }],
  (uiState) => uiState,
);
const selectApplicationFormState = createSelector(
  [(state: RootState) => {
    const {
      authEmail, appPIN,
    } = state.applicationForm;
    return {
      authEmail, appPIN,
    };
  }],
  (uiState) => uiState,
);
export const ApplicationPage = React.memo(function ApplicationPage() {
  const {
    completedFirstLoad,
    numberOfSteps, currentStep, loadedApplication, fetchStatus, invalidFields, canStepNext, showErrorDialog, loginMessage, fetchError,
  } = useSelector(selectUI);
  const { authEmail, appPIN } = useSelector(selectApplicationFormState);
  const loadingApplication = fetchStatus === FetchStatus.Loading;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useResolvedPath('');
  const location = useLocation();

  const onAuthEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(actions.setAuthEmail(e.target.value));
  };
  const onAppPINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(actions.setAppPIN(e.target.value));
  };
  const onClickLoadApplication = () => {
    dispatch(loadApplication({ authEmail, appPIN }));
  };
  const onSwipeToIndex = (index: number) => index !== currentStep && dispatch(clickedStepButton({
    goToStep: index,
  }));
  const onClickStepButton = (stepKey: keyof typeof StepName) => dispatch(clickedStepButton({
    goToStep: StepName[stepKey],
  }));
  const onClickGoAhead = () => dispatch(actions.clickedGoAhead());
  const onClickStayHere = () => {
    dispatch(actions.clickedStayHere());
  };
  const onClickExit = () => dispatch(exitAppSession());
  let loggedOutLabel = null;
  const search = new URLSearchParams(window.location.search);
  if (search.has('logout')) {
    loggedOutLabel = true;
  }
  useEffect(() => {
    if (!completedFirstLoad) {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('uuid')) {
        const uuid = sp.get('uuid');
        dispatch(loadById({ uuid }));
      } else if (!sp.has('login') && !sp.has('logout')) {
        dispatch(loadFromSession());
      }
    }
  }, [completedFirstLoad]);
  useEffect(() => {
    if (loadedApplication) {
      if (currentStep == null) {
        // find the step that matches the URL
        const stepFromURL = StepNames.reduce((
          stepToUse,
          currKey: keyof typeof StepName,
        ) => (`${pathname}/${currKey.toLowerCase()}` === location.pathname ? StepName[currKey] : stepToUse), null as StepName);
        dispatch(actions.applicationLoadedAndNoStepSet(stepFromURL));
      } else if (`${pathname}/${StepName[currentStep].toLowerCase()}` !== location.pathname) {
        // update the URL to the current step
        navigate(`${pathname}/${StepName[currentStep].toLowerCase()}`);
      }
    }
  }, [currentStep, loadedApplication]);
  let messageVariant: AlertProps['variant'] = 'primary';
  if (loadingApplication) messageVariant = 'info';
  if (fetchError) messageVariant = 'danger';
  return (
  <div className='application'>
    { !loadedApplication
    && (<div hidden={loadedApplication} style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
      <Container className='login-card'>
        <Row style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Col md='10'>
            <div className='p-5 mb-4 bg-light rounded-3'>
              <Row style={{ justifyContent: 'center' }}>
                <Col md='8'>
                  <Row style={{ justifyContent: 'center' }}>
                    <Col md='12' style={{ paddingBottom: 50 }}>
                      <Image src={Logo} style={{ width: '100%' }} />
                    </Col>
                  </Row>
                  <div>
                    <Alert variant={messageVariant}>
                      <Spinner hidden={!loadingApplication} size='sm' animation="border"/>
                      {` ${loggedOutLabel ? Labels.LoggedOut : loginMessage}`}
                    </Alert>
                  </div>
                  <div>
                    <Form.Group className='login-row'>
                      <Form.Label htmlFor='authEmail'>
                          {Labels.EnterEmail}
                        </Form.Label>
                      <Form.Control {...{
                        id: 'authEmail',
                        value: authEmail,
                        disabled: loadingApplication,
                        onChange: onAuthEmailChange,
                      }} />
                    </Form.Group>
                    <Form.Group className='login-row'>
                      <Form.Label htmlFor='appPIN'>
                        {Labels.EnterPIN}
                      </Form.Label>
                      <Form.Control {...{
                        id: 'appPIN',
                        value: appPIN,
                        disabled: loadingApplication,
                        onChange: onAppPINChange,
                      }} />
                    </Form.Group>
                    <Form.Group className='login-row'>
                      <Button {...{
                        onClick: onClickLoadApplication,
                      }}>{Labels.StartApplication}</Button>
                    </Form.Group>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </div>)
    }
    {loadedApplication
      && (<>
      <Navbar bg='light' expand='md' className='mb-2'>
        <Navbar.Brand className='d-flex align-items-center'>
          <Image src={Logo} className="d-inline-block align-top pr-2" style={{ width: '75' }} />
          {Labels.ApplicationTitle}
        </Navbar.Brand>
        <Navbar.Toggle className='d-md-none' aria-controls="basic-navbar-nav" />
        <Navbar.Collapse>
          <Nav className='d-md-none'>
              {StepNames.map((stepKey: keyof typeof StepName) => (
                <Nav.Link key={stepKey}>
                  <span onClick={() => onClickStepButton(stepKey)}>{Labels.StepTitle(StepName[stepKey])}</span>
                </Nav.Link>
              ))}
              <Nav.Link key='logout'>
                <Button className='p-0' variant='link' onClick={onClickExit}>Exit application</Button>
              </Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <div className='d-none d-md-flex ml-md-auto'>
          <Button variant='link' onClick={onClickExit}>Exit application</Button>
        </div>
      </Navbar>
      <Container hidden={!loadedApplication} fluid>
        <Row className='justify-content-center'>
          <Col md='auto' className='order-sm-1 order-1 d-md-none'>
            <StyledMobileStepper
              hidden={/* hide on disclaimer */ currentStep === StepName.Disclaimer}
              variant='dots'
              activeStep={currentStep}
              steps={numberOfSteps}
              nextButton={<StepNext/>}
              backButton={<StepBack/>}
            />
          </Col>
          <Col
          md='auto'
          className='d-none d-md-block'
          >
            <Stepper activeStep={currentStep} nonLinear>
              {StepNames.map((stepKey: keyof typeof StepName) => (
                <StyledStep key={stepKey}>
                  <StepButton onClick={() => onClickStepButton(stepKey)}>{Labels.StepTitle(StepName[stepKey])}</StepButton>
                </StyledStep>
              ))}
            </Stepper>
          </Col>
        </Row>
        <Row className='justify-content-center g-0' style={{ marginBottom: '55px' /* MobileStepper is 52px high */ }}>
        <Modal show={invalidFields.length > 0 && showErrorDialog}>
          <>
            <Modal.Header>
              <h2>{Labels.YouHaveErrorsTitle}</h2>
            </Modal.Header>
            <Modal.Body>
              <p>
                {Labels.YouHaveErrorsMessage}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Container fluid>
                <Row style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <p>{Labels.YouHaveErrorsAreYouSure}</p>
                </Row>
                <Row style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Col xs='6' className='d-flex justify-content-center'>
                    <Button onClick={onClickStayHere}>{Labels.YouHaveErrorsStayHere}</Button>
                  </Col>
                  <Col xs='6' className='d-flex justify-content-center'>
                    <Button disabled={!canStepNext} onClick={onClickGoAhead}>{Labels.YouHaveErrorsProceed}</Button>
                  </Col>
                </Row>
              </Container>
            </Modal.Footer>
          </>
        </Modal>
            <Col md={8} xs={12}>
              <SwipeableViews
                index={currentStep}
                onChangeIndex={onSwipeToIndex}>
                  {s.map(({ title, Component }) => (
                  <div className='mr-3 ml-3' key={title}>
                    <Component />
                  </div>
                  ))}
              </SwipeableViews>
            </Col>
        </Row>
        <div hidden={/* hide on disclaimer */ currentStep === StepName.Disclaimer}>
          <ScrollToTop showUnder={600} style={{ bottom: '60px', left: '5%' }} ><ArrowUpward /></ScrollToTop>
          <ScrollToTop showUnder={600} style={{ bottom: '60px', right: '5%' }}><ArrowUpward /></ScrollToTop>
        </div>
      </Container>
      </>)
    }
  </div>
  );
});
