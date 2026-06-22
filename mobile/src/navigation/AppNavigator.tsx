import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import MiRutaScreen from '../screens/MiRutaScreen';
import PedidoDetalleScreen from '../screens/PedidoDetalleScreen';
import PerfilScreen from '../screens/PerfilScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  PedidoDetalle: { pedidoId: number };
};

export type TabParamList = {
  MiRuta: undefined;
  Perfil: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="MiRuta" component={MiRutaScreen} options={{ title: 'Mi Ruta' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PedidoDetalle" component={PedidoDetalleScreen} options={{ title: 'Detalle Pedido' }} />
    </Stack.Navigator>
  );
}
