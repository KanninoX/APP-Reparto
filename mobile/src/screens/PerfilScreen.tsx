import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>; };

interface Stats { entregados: number; rechazados: number; enRuta: number; total: number; }

// Decodifica el payload del JWT sin librería externa
function parseJwt(token: string): Record<string, string> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return {}; }
}

function getInitials(nombre: string) {
  return nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function PerfilScreen({ navigation }: Props) {
  const [nombre, setNombre]   = useState('');
  const [email, setEmail]     = useState('');
  const [rol, setRol]         = useState('');
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const payload = parseJwt(token);
        setEmail(payload.sub ?? '');
        setRol(payload.rol ?? '');
      }

      try {
        // Datos del usuario autenticado
        const usuRes = await api.get('/usuarios/me');
        setNombre(usuRes.data.data?.nombre ?? '');

        // Estadísticas de pedidos del operario
        const pedRes = await api.get('/pedidos/mis-pedidos');
        const pedidos: { estado: string }[] = pedRes.data.data ?? [];
        setStats({
          total:       pedidos.length,
          entregados:  pedidos.filter(p => p.estado === 'ENTREGADO').length,
          rechazados:  pedidos.filter(p => p.estado === 'RECHAZADO' || p.estado === 'REAGENDADO').length,
          enRuta:      pedidos.filter(p => p.estado === 'EN_RUTA').length,
        });
      } catch {
        // Si el endpoint no existe aún, mostramos perfil sin stats
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const cerrarSesion = async () => {
    await AsyncStorage.multiRemove(['token']);
    navigation.replace('Login');
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#0F3B7E" />;

  const nombreDisplay = nombre || email.split('@')[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header con avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(nombreDisplay)}</Text>
        </View>
        <Text style={styles.nombre}>{nombreDisplay || '—'}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolText}>{rol}</Text>
        </View>
      </View>

      {/* Estadísticas */}
      {stats && (
        <View style={styles.statsGrid}>
          <StatCard label="Total pedidos" value={stats.total} color="#2563EB" icon="📦" />
          <StatCard label="Entregados"    value={stats.entregados} color="#10B981" icon="✓" />
          <StatCard label="Fallidos"      value={stats.rechazados} color="#EF4444" icon="✗" />
          <StatCard label="En ruta"       value={stats.enRuta}     color="#F59E0B" icon="🚚" />
        </View>
      )}

      {/* Info del dispositivo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de sesión</Text>
        <InfoRow label="Rol" value={rol} />
        <InfoRow label="Email" value={email} />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.btnLogout} onPress={cerrarSesion}>
        <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { paddingBottom: 40 },

  // Header
  header: { backgroundColor: '#0F3B7E', alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 3, borderColor: '#86a8f2' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  nombre: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: '#93c5fd', marginBottom: 12 },
  rolBadge: { backgroundColor: '#1d4ed8', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  rolText: { fontSize: 11, fontWeight: '700', color: '#bfdbfe', letterSpacing: 1, textTransform: 'uppercase' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },

  // Info section
  section: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', maxWidth: '60%', textAlign: 'right' },

  // Logout
  btnLogout: { marginHorizontal: 16, backgroundColor: '#EF4444', borderRadius: 10,
    padding: 16, alignItems: 'center' },
  btnLogoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
