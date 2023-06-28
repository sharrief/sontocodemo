import React from 'react';
import Card from 'react-bootstrap/Card';
import Labels from '@application/Labels';
import {
  Acknowledgement, StepBack,
} from '@application/Fields';
import { useDispatch, useSelector } from 'react-redux';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import OpenInNew from '@mui/icons-material/OpenInNew';
import {
  ApplicantEntityType, AssetType, IncomeSource, InvestmentInstrument, RiskProfile, USDValueBracketToLabel,
} from '@interfaces';
import { RootState } from '@application/application.store';
import { AnyAction, createSelector, ThunkAction } from '@reduxjs/toolkit';
import countries from 'i18n-iso-countries';
import enjson from 'i18n-iso-countries/langs/en.json';
import { saveApplication } from '../applicationForm.behavior';

countries.registerLocale(enjson);
const countryObject = countries.getNames('en', { select: 'official' });
const openPowerFormInNewWindow = (): ThunkAction<void, RootState, unknown, AnyAction> => (dispatch, getState) => {
  const { app: application } = getState().dataState;
  const {
    representativeContact, managerEmail, managerName,
  } = application;
  const powerFormLink = 'https://na3.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=0ccfe419-bf5e-49ef-8ae3-2101edcf4161&env=na3&acct=cfe3e78f-bd47-46b5-8b4b-c9fed0151db3&v=2';
  let parameterizedLink = `${powerFormLink}&Client_UserName=${`${representativeContact.name?.trim()} ${representativeContact.lastName?.trim()}`}&Client_Email=${representativeContact?.email}&Account Manager_UserName=${managerName?.trim()}&Account Manager_Email=${managerEmail}`;
  parameterizedLink = `${parameterizedLink}&Radio Group eb5b0bfe-2588-467e-a58f-ae961b1f1498=${encodeURIComponent(ApplicantEntityType[application.entityType])}`;
  const { applicantContact } = application;
  parameterizedLink = `${parameterizedLink}&Name=${encodeURIComponent(`${applicantContact.name} ${applicantContact.lastName}`)}`;
  const applicantIdentificationNumberLength = applicantContact.identificationNumber.length;
  const applicantIdentificationNumberRedactedArray = new Array(applicantIdentificationNumberLength);
  const applicantIdentificationNumberRedacted = applicantIdentificationNumberRedactedArray.fill('x', 0, applicantIdentificationNumberLength).join('');
  parameterizedLink = `${parameterizedLink}&Identification number=${encodeURIComponent(applicantIdentificationNumberRedacted)}`;
  const { legalAddress } = applicantContact;
  parameterizedLink = `${parameterizedLink}&Residential/legal address=${encodeURIComponent(
    `${legalAddress.line1}
${legalAddress.line2}
${legalAddress.city}, ${legalAddress.province} ${legalAddress.postal} ${countryObject[legalAddress.country]}`,
  )}`;
  const { day, month, year } = applicantContact.dateOfBirth;
  parameterizedLink = `${parameterizedLink}&birth_month 3b058c16-ebbc-4e9d-a2db-e24d54eb1082=${encodeURIComponent(month)}`;
  parameterizedLink = `${parameterizedLink}&birth_day ae9cbb10-15a0-47dd-990c-555739564468=${encodeURIComponent(day)}`;
  parameterizedLink = `${parameterizedLink}&birth_year 66c8c099-8d3c-4205-b296-be2f3d90025d=${encodeURIComponent(year)}`;
  parameterizedLink = `${parameterizedLink}&Phone number=${encodeURIComponent(applicantContact.phone)}`;
  parameterizedLink = `${parameterizedLink}&Tax paying country=${encodeURIComponent(countryObject[application.taxCountry])}`;
  const experienceToDataLabelMap = {
    [InvestmentInstrument.None]: 'No experience',
    [InvestmentInstrument.WealthManagement]: 'Wealth management',
    [InvestmentInstrument.Investments]: 'Investments',
    [InvestmentInstrument.FundInvestments]: 'Investments in funds',
    [InvestmentInstrument.Other]: 'Other investments (specify)',
    [InvestmentInstrument.Independent]: 'Independent investing 3 or more years',
    [InvestmentInstrument.Stocks]: 'Stocks',
    [InvestmentInstrument.Bonds]: 'Bonds',
    [InvestmentInstrument.ShortTerm]: 'Short-term investments',
    [InvestmentInstrument.StructuredProducts]: 'Structured products',
    [InvestmentInstrument.HedgeFunds]: 'Hedge funds',
    [InvestmentInstrument.Derivatives]: 'Derivatives',
    [InvestmentInstrument.Warrants]: 'Warrants',
  };
  application.investmentExperience.forEach((experience) => {
    parameterizedLink = `${parameterizedLink}&${experienceToDataLabelMap[experience]}=x`;
  });
  parameterizedLink = `${parameterizedLink}&Other investments text=${encodeURIComponent(application.investmentExperienceOther)}`;

  const { expectedInvestmentLengthInYears: target } = application;
  if (target <= 0) {
    parameterizedLink = `${parameterizedLink}&Other investment length (specify)=x`;
    parameterizedLink = `${parameterizedLink}&Other investment length text=${application.expectedInvestmentLengthOther}`;
  } else if (target <= 3) {
    parameterizedLink = `${parameterizedLink}&1to3yrs=x`;
  } else if (target <= 10) {
    parameterizedLink = `${parameterizedLink}&3to10yrs=x`;
  } else if (target > 10) {
    parameterizedLink = `${parameterizedLink}&10yrs=x`;
  }
  const { riskProfile } = application;
  if (riskProfile === RiskProfile.High) {
    parameterizedLink = `${parameterizedLink}&Risk profile=High`;
  } else if (riskProfile === RiskProfile.Low) {
    parameterizedLink = `${parameterizedLink}&Risk profile=Low`;
  } else if (riskProfile === RiskProfile.Average) {
    parameterizedLink = `${parameterizedLink}&Risk profile=Average`;
  }
  if (application.entityType !== ApplicantEntityType.Individual && application.checkedAuthorizedByEntity) {
    parameterizedLink = `${parameterizedLink}&Is corporation=Confirm is corp`;
  }
  parameterizedLink = `${parameterizedLink}&Income_source=${IncomeSource[application.incomeSource]}`;
  parameterizedLink = `${parameterizedLink}&Income source other text=${encodeURIComponent(application.incomeSourceOther)}`;
  parameterizedLink = `${parameterizedLink}&Size of income=${USDValueBracketToLabel(application.incomeSize)}`;
  parameterizedLink = `${parameterizedLink}&Financial commitments=${USDValueBracketToLabel(application.financialCommitments)}`;
  parameterizedLink = `${parameterizedLink}&Total assets=${USDValueBracketToLabel(application.financialAssets)}`;
  parameterizedLink = `${parameterizedLink}&Total liabilities=${USDValueBracketToLabel(application.financialLiabilities)}`;
  const assetTypeToDataLabelMap = {
    [AssetType.BankInvestments]: 'Assets Bank investments',
    [AssetType.Stocks]: 'Assets Stocks',
    [AssetType.Funds]: 'Assets Funds',
    [AssetType.RealEstate]: 'Assets Real estate',
    [AssetType.Alternative]: 'Assets Alternative investments',
    [AssetType.Other]: 'Assets: other',
  };
  application.assetTypes.forEach((assetType) => {
    parameterizedLink = `${parameterizedLink}&${assetTypeToDataLabelMap[assetType]}=x`;
  });
  parameterizedLink = `${parameterizedLink}&Assets other text=${encodeURIComponent(application.assetTypeOther)}`;

  parameterizedLink = `${parameterizedLink}&Contact Name=${encodeURIComponent(`${representativeContact.name} ${representativeContact.lastName}`)}`;
  const representativeIdentificationNumberLength = representativeContact.identificationNumber.length;
  const representativeIdentificationNumberRedactedArray = new Array(representativeIdentificationNumberLength);
  const representativeIdentificationNumberRedacted = representativeIdentificationNumberRedactedArray.fill('x', 0, representativeIdentificationNumberLength).join('');
  parameterizedLink = `${parameterizedLink}&Contact ID=${encodeURIComponent(representativeIdentificationNumberRedacted)}`;
  const { mailingAddress } = representativeContact;
  parameterizedLink = `${parameterizedLink}&Contact postal=${encodeURIComponent(
    `${mailingAddress.line1}
${mailingAddress.line2}
${mailingAddress.city}, ${mailingAddress.province} ${mailingAddress.postal} ${countryObject[mailingAddress.country]}`,
  )}`;
  parameterizedLink = `${parameterizedLink}&Contact phone=${encodeURIComponent(representativeContact.phone)}`;
  parameterizedLink = `${parameterizedLink}&Contact education=${encodeURIComponent(representativeContact.educationLevel)}`;
  parameterizedLink = `${parameterizedLink}&Contact profession=${encodeURIComponent(representativeContact.profession)}`;

  if (application.checkedAuthentic && application.checkedNotUnlawful) {
    parameterizedLink = `${parameterizedLink}&Confirm agreement=Confirmed`;
  }
  dispatch(Acknowledgement.actions.onClickedToSign(true));
  const updatedApp = getState().dataState.app;
  dispatch(saveApplication(updatedApp));
  window.open(parameterizedLink);
};

const selectChekedBoxes = createSelector([
  (state: RootState) => state.dataState.app.checkedAuthentic,
  (state: RootState) => state.dataState.app.checkedNotUnlawful,
  (state: RootState) => state.dataState.app.clickedToSign,
], (checkedAuthentic, checkedNotUnlawful, clickedToSign) => ({
  checkedAuthentic, checkedNotUnlawful, clickedToSign,
}));

export const step8 = ({
  title: Labels.SignTitle,
  Component: React.memo(function Step8() {
    const {
      checkedAuthentic, checkedNotUnlawful, clickedToSign,
    } = useSelector(selectChekedBoxes);

    const dispatch = useDispatch();
    const disabled = !checkedAuthentic || !checkedNotUnlawful || clickedToSign;

    return (
      <>
        <Card>
          <Card.Header><h5>{Labels.SignTitle}</h5></Card.Header>
          <Card.Body>
            <Acknowledgement.component />
          </Card.Body>
          <Card.Footer>
            <Row className='justify-content-between mb-2'>
              <Col><StepBack className='w-100' /></Col>
              <Col className='d-flex flex-column align-items-end'>
                <Button {...{
                  className: 'w-100',
                  disabled,
                  onClick: () => (!disabled && dispatch(openPowerFormInNewWindow())),
                }}>
                  {Labels.SignButtonLabel}
                  <OpenInNew className='ml-1'/>
                </Button>
              </Col>
            </Row>
          </Card.Footer>
        </Card>
      </>
    );
  }),
});
