import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>; };

// Genera un UUID v4 simple para identificar el dispositivo
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('deviceId').then((stored) => {
      if (stored) { setDeviceId(stored); return; }
      const nuevo = uuidv4();
      AsyncStorage.setItem('deviceId', nuevo);
      setDeviceId(nuevo);
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Ingrese email y contraseña'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, deviceId });
      const { token } = res.data.data;
      await AsyncStorage.setItem('token', token);
      navigation.replace('Main');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes('Dispositivo')) {
        Alert.alert('Acceso bloqueado', msg);
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>App Reparto</Text>
      <Text style={styles.subtitle}>Operario</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ingresar</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F3F4F6' },
  title: { fontSize: 28, fontWeight: '700', color: '#0F3B7E', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12,
    fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  button: { backgroundColor: '#2563EB', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
