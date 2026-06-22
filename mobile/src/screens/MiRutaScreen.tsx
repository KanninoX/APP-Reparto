import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

interface RutaPedido { pedido: { id: number; direccionEntrega: string; estado: string; cliente: { nombre: string } }; ordenEntrega: number; }
interface Ruta { id: number; nombre: string; fecha: string; rutaPedidos: RutaPedido[]; vehiculo: { id: number }; usuario: { id: number } }

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>; };

export default function MiRutaScreen({ navigation }: Props) {
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const stompRef = useRef<Client | null>(null);

  const cargarRuta = () =>
    api.get('/rutas/mi-ruta')
      .then((r) => setRuta(r.data.data))
      .catch(() => Alert.alert('Info', 'No tienes ruta activa por el momento'))
      .finally(() => setLoading(false));

  useEffect(() => { cargarRuta(); }, []);

  useEffect(() => {
    if (!ruta) return;
    let watchId: number;

    const iniciarWS = async () => {
      const token = await AsyncStorage.getItem('token');
      const client = new Client({
        webSocketFactory: () => new SockJS('http://10.0.2.2:8080/ws'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
          // Tracking GPS
          watchId = Geolocation.watchPosition(
            ({ coords }) => {
              client.publish({
                destination: '/app/tracking',
                body: JSON.stringify({
                  vehiculoId: ruta.vehiculo.id,
                  latitud: coords.latitude,
                  longitud: coords.longitude,
                  velocidadKmh: (coords.speed ?? 0) * 3.6,
                }),
              });
            },
            undefined,
            { interval: 10000, distanceFilter: 10 }
          );

          // Suscripción a cambios de ruta en tiempo real (HU2)
          client.subscribe(`/topic/ruta/${ruta.usuario.id}`, (msg) => {
            const rutaActualizada: Ruta = JSON.parse(msg.body);
            setRuta(rutaActualizada);
            Alert.alert('Ruta actualizada', 'El ejecutivo agregó un nuevo pedido a tu ruta.');
          });
        },
      });
      client.activate();
      stompRef.current = client;
    };

    iniciarWS();
    return () => {
      Geolocation.clearWatch(watchId);
      stompRef.current?.deactivate();
    };
  }, [ruta?.id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!ruta) return <View style={styles.empty}><Text>Sin ruta activa</Text></View>;

  const pedidosOrdenados = [...ruta.rutaPedidos].sort((a, b) => a.ordenEntrega - b.ordenEntrega);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{ruta.nombre}</Text>
      <Text style={styles.fecha}>Fecha: {ruta.fecha} · {pedidosOrdenados.length} paradas</Text>
      <FlatList
        data={pedidosOrdenados}
        keyExtractor={(item) => String(item.pedido.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('PedidoDetalle', { pedidoId: item.pedido.id })}>
            <Text style={styles.orden}>{item.ordenEntrega + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.clienteNombre}>{item.pedido.cliente?.nombre}</Text>
              <Text style={styles.direccion}>{item.pedido.direccionEntrega}</Text>
            </View>
            <View style={[styles.badge, item.pedido.estado === 'ENTREGADO' && styles.badgeOk]}>
              <Text style={styles.badgeText}>{item.pedido.estado}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  header: { fontSize: 20, fontWeight: '700', color: '#0F3B7E', marginBottom: 4 },
  fecha: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  orden: { fontSize: 22, fontWeight: '700', color: '#2563EB', marginRight: 12, width: 30 },
  clienteNombre: { fontWeight: '600', fontSize: 15, color: '#1F2937' },
  direccion: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: { backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOk: { backgroundColor: '#10B981' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
