import { API } from '@api';
import useSWR from 'swr';

export default function useReceivingBanks() {
  const { data, error, isLoading } = useSWR([API.BankData.GetReceivingBanks.Route], () => API.BankData.GetReceivingBanks.get());
  return { receivingBanks: data?.receivingBanks || null, error, isLoading };
}
