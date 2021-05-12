/* eslint-disable no-unused-vars */

import { useAsyncStorage } from '@react-native-async-storage/async-storage';

export default async function useLocalStorage(value) {
    const { getItem } = useAsyncStorage(value);
    return await getItem();
}