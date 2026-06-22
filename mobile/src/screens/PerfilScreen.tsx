import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>; };

export default function PerfilScreen({ navigation }: Props) {
  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      <TouchableOpacity style={styles.btn} onPress={cerrarSesion}>
        <Text style={styles.btnText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F3B7E', marginBottom: 32 },
  btn: { backgroundColor: '#EF4444', borderRadius: 8, padding: 16, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
