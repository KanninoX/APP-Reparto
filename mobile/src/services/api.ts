import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// En desarrollo, apuntar a la IP local donde corre el backend
const BASE_URL = 'http://10.0.2.2:8080/api'; // Android emulator → localhost
// const BASE_URL = 'http://localhost:8080/api'; // iOS simulator

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
