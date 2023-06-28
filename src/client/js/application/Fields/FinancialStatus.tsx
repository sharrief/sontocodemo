/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { $enum } from 'ts-enum-util';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import {
  IApplication, IncomeSource, ApplicantEntityType, FieldNames, AssetType, USDValueBracket, USDValueBracketToLabel,
} from '@interfaces';
import { RootState } from '@application/application.store';
import { ActionCreatorWithPayload, createSelector, createSlice } from '@reduxjs/toolkit';
import InputGroup from 'react-bootstrap/InputGroup';
import { ValidationMessageAndValue } from '@validation';
import { applyThenValidate } from '@application/applicationForm.behavior';
import { propValidation, ValidationFeedback } from '../Validation';

const initialState: Pick<IApplication,
'checkedAuthorizedByEntity'|'incomeSource'|'incomeSourceOther'
|'incomeSize'|'financialCommitments'|'financialAssets'|'financialLiabilities'
|'assetTypes'|'assetTypeOther'> = {
  checkedAuthorizedByEntity: false,
  incomeSource: null,
  incomeSourceOther: '',
  incomeSize: USDValueBracket.Empty,
  financialCommitments: USDValueBracket.Empty,
  financialAssets: USDValueBracket.Empty,
  financialLiabilities: USDValueBracket.Empty,
  assetTypes: [],
  assetTypeOther: '',
};

export const { actions, reducer } = createSlice({
  name: 'financialStatus',
  initialState,
  reducers: {
    onCheckedAuthorizedByEntity: (state, { payload }) => {
      state.checkedAuthorizedByEntity = payload;
    },
    onIncomeSourceChange: (state, { payload }) => {
      state.incomeSourceOther = '';
      state.incomeSource = payload;
    },
    onIncomeSourceOtherChange: (state, { payload }) => {
      state.incomeSourceOther = payload;
    },
    onIncomeSizeChange: (state, { payload }) => {
      state.incomeSize = payload;
    },
    onFinancialCommitmentsChange: (state, { payload }) => {
      state.financialCommitments = payload;
    },
    onFinancialAssetsChange: (state, { payload }) => {
      state.financialAssets = payload;
    },
    onFinancialLiabilitiesChange: (state, { payload }) => {
      state.financialLiabilities = payload;
    },
    onAssetTypesChange: (state, { payload }) => {
      state.assetTypeOther = '';
      state.assetTypes = payload;
    },
    onAssetTypeOtherChange: (state, { payload }) => {
      state.assetTypeOther = payload;
    },
  },
});

export const validateFieldNames = [
  FieldNames.Application.incomeSourceOther,
  FieldNames.Application.assetTypeOther,
  FieldNames.Application.checkedAuthorizedByEntity,
  FieldNames.Application.incomeSize,
  FieldNames.Application.financialCommitments,
  FieldNames.Application.financialAssets,
  FieldNames.Application.financialLiabilities];

const selectFinancialStatusState = createSelector([
  (state: RootState) => {
    const {
      checkedAuthorizedByEntity, entityType,
      incomeSource, incomeSourceOther,
      incomeSize, financialCommitments, financialAssets, financialLiabilities,
      assetTypes, assetTypeOther,
    } = state.dataState.app;
    return {
      checkedAuthorizedByEntity,
      entityType,
      incomeSource,
      incomeSourceOther,
      incomeSize,
      financialCommitments,
      financialAssets,
      financialLiabilities,
      assetTypes,
      assetTypeOther,
    };
  },
  (state: RootState) => state.dataState.app.clickedToSign,
],
(fields, clickedToSign) => ({ fields, clickedToSign }));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }));

function FinancialStatus() {
  const { clickedToSign, fields: state } = useSelector(selectFinancialStatusState);
  const {
    checkedAuthorizedByEntity, entityType,
    incomeSource, incomeSourceOther,
    incomeSize, financialCommitments, financialAssets, financialLiabilities,
    assetTypes, assetTypeOther,
  } = state;
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as {[key in keyof Pick<IApplication,
    'incomeSourceOther' | 'assetTypeOther' | 'checkedAuthorizedByEntity'
    | 'incomeSize' | 'financialAssets' | 'financialCommitments' | 'financialLiabilities'>]: ValidationMessageAndValue};
  ({
    incomeSourceOther: validations.incomeSourceOther,
    assetTypeOther: validations.assetTypeOther,
    checkedAuthorizedByEntity: validations.checkedAuthorizedByEntity,
    financialAssets: validations.financialAssets,
    financialCommitments: validations.financialCommitments,
    financialLiabilities: validations.financialLiabilities,
    incomeSize: validations.incomeSize,
  } = validationMessages);

  const dispatch = useDispatch();
  const disabled = clickedToSign;
  const incomeOtherDisabled = disabled || incomeSource !== IncomeSource.Other;
  const otherAssetDisabled = disabled || !assetTypes?.find((choice) => choice === AssetType.Other);
  const toggleAssetType = (toggledAssetType: AssetType) => {
    // Must use copy since we are modifying the array
    const copyOfAssetTypes = [...assetTypes];
    const copyOfToggledAssetType = copyOfAssetTypes.find((choice) => choice === toggledAssetType);
    if (copyOfToggledAssetType != null) {
      const index = copyOfAssetTypes.indexOf(copyOfToggledAssetType);
      copyOfAssetTypes.splice(index, 1);
    } else {
      copyOfAssetTypes.push(toggledAssetType);
    }
    dispatch(applyThenValidate(actions.onAssetTypesChange(copyOfAssetTypes)));
  };
  return (
    <div>
      {entityType !== ApplicantEntityType.Individual
        && <>
          <Row>
            <Form.Label>{Labels.AuthorizedByEntityInstruction}</Form.Label>
          </Row>
          <Row>
            <Form.Group as={Col}>
              <Form.Check
                {...{
                  id: FieldNames.Application.checkedAuthorizedByEntity,
                  disabled,
                  type: 'checkbox',
                  ...propValidation(state, validations, 'checkedAuthorizedByEntity', isServerValidated, false),
                  feedback: validations?.checkedAuthorizedByEntity?.message,
                  label: Labels.AuthorizedByEntityLabel,
                  checked: checkedAuthorizedByEntity || false,
                  // eslint-disable-next-line no-console
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    dispatch(applyThenValidate(actions.onCheckedAuthorizedByEntity(e.target.checked)));
                  },
                }} />
            </Form.Group>
          </Row>
          <hr/>
        </>
      }
      <Row>
        <Form.Label>{Labels.IncomeSourceInstruction}</Form.Label>
      </Row>
      <Row>
        {[
          { id: `${FieldNames.Application.incomeSource}-${IncomeSource.Active}`, label: Labels.IncomeSourceActive, choice: IncomeSource.Active },
          { id: `${FieldNames.Application.incomeSource}-${IncomeSource.Passive}`, label: Labels.IncomeSourcePassive, choice: IncomeSource.Passive },
          { id: `${FieldNames.Application.incomeSource}-${IncomeSource.Other}`, label: Labels.IncomeSourceOther, choice: IncomeSource.Other },
        ].map(({ id, label, choice }) => (
          <Form.Group key={id} as={Col} xs={12} sm={6} md={4}>
            <Form.Check {...{
              id,
              disabled,
              type: 'radio',
              label,
              checked: incomeSource === choice,
              // eslint-disable-next-line no-console
              onChange: () => (choice !== IncomeSource.Other ? dispatch(applyThenValidate(actions.onIncomeSourceChange(choice))) : dispatch(actions.onIncomeSourceChange(choice))),
            }} />
          </Form.Group>
        ))}
      </Row>
      <Row>
        <Form.Group as={Col}>
          <Form.Control {...{
            id: FieldNames.Application.incomeSourceOther,
            type: 'text',
            ...propValidation(state, validations, 'incomeSourceOther', isServerValidated),
            disabled: incomeOtherDisabled,
            placeholder: !incomeOtherDisabled ? Labels.IncomeSourceOtherInstruction : '',
            value: incomeSourceOther,
            onChange: (e) => dispatch(applyThenValidate(actions.onIncomeSourceOtherChange(e.target.value))),
          }} />
          <Form.Label htmlFor={FieldNames.Application.incomeSourceOther}>{Labels.IncomeSourceOtherInstruction}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'incomeSourceOther' }} />
        </Form.Group>
      </Row>
      <hr/>
      {([
        {
          label: Labels.IncomeSize, id: FieldNames.Application.incomeSize, value: incomeSize, action: actions.onIncomeSizeChange,
        },
        {
          label: Labels.IncomeCommitmentsSize, id: FieldNames.Application.financialCommitments, value: financialCommitments, action: actions.onFinancialCommitmentsChange,
        },
        {
          label: Labels.IncomeTotalAssetsSize, id: FieldNames.Application.financialAssets, value: financialAssets, action: actions.onFinancialAssetsChange,
        },
        {
          label: Labels.IncomeTotalDebtsSize, id: FieldNames.Application.financialLiabilities, value: financialLiabilities, action: actions.onFinancialLiabilitiesChange,
        },
      ] as {label: string; id: keyof Pick<IApplication, 'incomeSize' | 'financialAssets' | 'financialCommitments' | 'financialLiabilities'>; value: number; action: ActionCreatorWithPayload<number>}[]).map(({
        label, id, value, action,
      }) => (
          <Row key={id}>
            <Form.Label className='text-md-right' column htmlFor={id} md={6}>{label}</Form.Label>
            <Col>
              <InputGroup hasValidation>

                  <InputGroup.Text>$</InputGroup.Text>

                <Form.Control
                  as='select'
                  disabled={disabled}
                  defaultValue={value}
                  {...propValidation(state, validations, id, isServerValidated, USDValueBracket.Empty)} onChange={ (e) => dispatch(applyThenValidate(action(+e.target.value)))
                }>
                  {$enum(USDValueBracket).map((key) => (
                    <option key={key} value={key}>{USDValueBracketToLabel(key)}</option>
                  ))}
                </Form.Control>
                <ValidationFeedback validations={validations} name={id} />
              </InputGroup>
            </Col>
          </Row>
      ))}
      <hr/>
      <Row>
        <Form.Label>{Labels.AssetTypesInstruction}</Form.Label>
      </Row>
      <Row>
        {$enum(AssetType)
          .map((asset) => (
              <Form.Group key={asset} as={Col} xs={12} sm={6} md={4}>
                <Form.Check {...{
                  id: `${FieldNames.Application.assetTypes}-${asset}`, // must be globally unique for onChange to target correctly
                  type: 'switch',
                  disabled,
                  label: Labels.AssetTypeDescription[asset],
                  checked: assetTypes?.includes(asset) || false,
                  // eslint-disable-next-line no-console
                  onChange: () => toggleAssetType(asset),
                }} />
              </Form.Group>
          ))}
      </Row>
      <Row>
        <Form.Group as={Col}>
          <Form.Control {...{
            id: FieldNames.Application.assetTypeOther,
            type: 'text',
            disabled: otherAssetDisabled,
            ...propValidation(state, validations, 'assetTypeOther', isServerValidated),
            placeholder: !otherAssetDisabled ? Labels.AssetTypesOtherInstruction : '',
            value: assetTypeOther,
            onChange: (e) => dispatch(applyThenValidate(actions.onAssetTypeOtherChange(e.target.value))),
          }} />
          <Form.Label htmlFor={FieldNames.Application.incomeSourceOther}>{Labels.AssetTypesOtherInstruction}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'assetTypeOther' }} />
        </Form.Group>
      </Row>
    </div>
  );
}

export const component = React.memo(FinancialStatus);
