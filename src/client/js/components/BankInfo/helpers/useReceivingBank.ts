import { API } from '@api';
import { DefaultReceivingBank, IReceivingBank } from '@interfaces';
import useSWR from 'swr';

export default function useReceivingBank(receivingBankId: IReceivingBank['id']) {
  const { data, error, isLoading } = useSWR([API.BankData.GetReceivingBank.Route], () => API.BankData.GetReceivingBank.post({ receivingBankId }));
  return { receivingBank: data?.receivingBank || DefaultReceivingBank, error, isLoading };
}
