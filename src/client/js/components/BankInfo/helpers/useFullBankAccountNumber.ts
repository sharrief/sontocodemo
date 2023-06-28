import { API } from '@api';
import { useBankAccounts } from '@admin/admin.store';
import { Dispatch } from 'redux';
import { IBankDatumTrimmed } from '@interfaces';
import { useEffect } from 'react';

export default async function useFullBankAccountNumber(
  accountNumber: string,
  uuid: string,
  dispatch: Dispatch,
) {
  const {
    mutate,
  } = useBankAccounts(accountNumber, dispatch);
  useEffect(() => {
    if (accountNumber && uuid) {
      mutate(async (cacheData: { bankAccounts: IBankDatumTrimmed[] } = { bankAccounts: [] }) => {
        const { bankAccount: newBankDatum } = await API.BankData.WithAccountNumber.post({ uuid });
        return {
          bankAccounts: cacheData.bankAccounts.map((cacheDatum) => {
            if (uuid === cacheDatum.uuid) return newBankDatum;
            return cacheDatum;
          }),
        };
      }, false);
    }
  }, [accountNumber, uuid]);
}
