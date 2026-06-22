import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PedidoDetalle'>;
  route: RouteProp<RootStackParamList, 'PedidoDetalle'>;
};

interface Pedido {
  id: number; estado: string; direccionEntrega: string; observaciones: string;
  cliente: { nombre: string; rut: string; telefono: string };
}

export default function PedidoDetalleScreen({ route, navigation }: Props) {
  const { pedidoId } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    api.get(`/pedidos/${pedidoId}`).then((r) => setPedido(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (estado: string) => {
    await api.put(`/pedidos/${pedidoId}/estado?estado=${estado}`);
    cargar();
  };

  const tomarFoto = () => {
    launchCamera({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (response.didCancel || !response.assets?.[0]?.uri) return;
      const formData = new FormData();
      formData.append('archivo', { uri: response.assets[0].uri, type: 'image/jpeg', name: 'factura.jpg' } as never);
      formData.append('pedidoId', String(pedidoId));
      formData.append('tipo', 'FOTO_FACTURA');
      await api.post('/documentos/subir', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Éxito', 'Foto subida correctamente');
    });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!pedido) return <View style={styles.container}><Text>Pedido no encontrado</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.value}>{pedido.cliente?.nombre}</Text>
        <Text style={styles.label}>RUT</Text>
        <Text style={styles.value}>{pedido.cliente?.rut}</Text>
        <Text style={styles.label}>Dirección de entrega</Text>
        <Text style={styles.value}>{pedido.direccionEntrega}</Text>
        <Text style={styles.label}>Estado</Text>
        <Text style={[styles.value, { color: '#2563EB', fontWeight: '700' }]}>{pedido.estado}</Text>
        {pedido.observaciones && <>
          <Text style={styles.label}>Observaciones</Text>
          <Text style={styles.value}>{pedido.observaciones}</Text>
        </>}
      </View>

      <TouchableOpacity style={styles.btnFoto} onPress={tomarFoto}>
        <Text style={styles.btnText}>📷 Tomar foto de factura</Text>
      </TouchableOpacity>

      {pedido.estado === 'EN_RUTA' && (
        <>
          <TouchableOpacity style={[styles.btn, styles.btnOk]} onPress={() => cambiarEstado('ENTREGADO')}>
            <Text style={styles.btnText}>✓ Marcar como Entregado</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnError]} onPress={() => cambiarEstado('RECHAZADO')}>
            <Text style={styles.btnText}>✗ Marcar como Rechazado</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 12, color: '#6B7280', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: '#1F2937', marginTop: 2 },
  btn: { borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnOk: { backgroundColor: '#10B981' },
  btnError: { backgroundColor: '#EF4444' },
  btnFoto: { backgroundColor: '#2563EB', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
