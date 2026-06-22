import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Modal
} from 'react-native';
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

const MOTIVOS_RECHAZO = [
  'Cliente ausente',
  'Dirección incorrecta',
  'Producto dañado',
  'Rechazado por el cliente',
  'Acceso bloqueado',
  'Otro',
];

export default function PedidoDetalleScreen({ route, navigation }: Props) {
  const { pedidoId } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalRechazo, setModalRechazo] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [reagendar, setReagendar] = useState(false);

  const cargar = () => {
    api.get(`/pedidos/${pedidoId}`).then((r) => setPedido(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  // Sube la foto y resuelve true si tuvo éxito, false si el usuario canceló
  const tomarFotoObligatoria = (): Promise<boolean> =>
    new Promise((resolve) => {
      launchCamera({ mediaType: 'photo', quality: 0.7 }, async (response) => {
        if (response.didCancel || !response.assets?.[0]?.uri) {
          resolve(false);
          return;
        }
        const formData = new FormData();
        formData.append('archivo', {
          uri: response.assets[0].uri, type: 'image/jpeg', name: 'factura.jpg',
        } as never);
        formData.append('pedidoId', String(pedidoId));
        formData.append('tipo', 'FOTO_FACTURA');
        await api.post('/documentos/subir', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        resolve(true);
      });
    });

  const marcarEntregado = async () => {
    const fotoTomada = await tomarFotoObligatoria();
    if (!fotoTomada) {
      Alert.alert('Foto requerida', 'Debes fotografiar la factura firmada para registrar la entrega.');
      return;
    }
    await api.put(`/pedidos/${pedidoId}/estado?estado=ENTREGADO`);
    Alert.alert('Éxito', 'Pedido marcado como entregado');
    cargar();
  };

  const confirmarRechazo = async () => {
    if (!motivoSeleccionado) {
      Alert.alert('Motivo requerido', 'Selecciona un motivo de rechazo.');
      return;
    }
    const estado = reagendar ? 'REAGENDADO' : 'RECHAZADO';
    await api.put(
      `/pedidos/${pedidoId}/estado?estado=${estado}&motivoRechazo=${encodeURIComponent(motivoSeleccionado)}&reagendar=${reagendar}`
    );
    setModalRechazo(false);
    setMotivoSeleccionado('');
    setReagendar(false);
    cargar();
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

      {pedido.estado === 'EN_RUTA' && (
        <>
          <TouchableOpacity style={[styles.btn, styles.btnOk]} onPress={marcarEntregado}>
            <Text style={styles.btnText}>📷 Fotografiar y marcar como Entregado</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnError]} onPress={() => setModalRechazo(true)}>
            <Text style={styles.btnText}>✗ Marcar como Fallido</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal de rechazo */}
      <Modal visible={modalRechazo} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Motivo del rechazo</Text>
            <Text style={styles.modalSubtitle}>Selecciona obligatoriamente un motivo:</Text>

            {MOTIVOS_RECHAZO.map((motivo) => (
              <TouchableOpacity
                key={motivo}
                style={[styles.motivoRow, motivoSeleccionado === motivo && styles.motivoSelected]}
                onPress={() => setMotivoSeleccionado(motivo)}>
                <View style={[styles.radio, motivoSeleccionado === motivo && styles.radioSelected]} />
                <Text style={styles.motivoText}>{motivo}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.reagendarRow} onPress={() => setReagendar(r => !r)}>
              <View style={[styles.checkbox, reagendar && styles.checkboxChecked]}>
                {reagendar && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={styles.motivoText}>Reagendar entrega</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancelar}
                onPress={() => { setModalRechazo(false); setMotivoSeleccionado(''); setReagendar(false); }}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnError, { flex: 1, marginBottom: 0 }]}
                onPress={confirmarRechazo}>
                <Text style={styles.btnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  motivoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  motivoSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  motivoText: { fontSize: 14, color: '#1F2937', marginLeft: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#9CA3AF' },
  radioSelected: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  reagendarRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    marginTop: 4, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: '#10B981', backgroundColor: '#10B981' },
  modalActions: { flexDirection: 'row', gap: 12 },
  btnCancelar: { flex: 1, borderRadius: 8, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
});
