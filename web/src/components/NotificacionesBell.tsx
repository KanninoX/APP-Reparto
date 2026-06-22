import { useEffect, useState } from 'react';
import {
  IconButton, Badge, Popover, List, ListItem, ListItemText,
  Typography, Box, Button, Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../services/api';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: string;
  fechaCreacion: string;
}

export default function NotificacionesBell() {
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const cargar = () => {
    api.get('/notificaciones').then((r) => setNotifs(r.data.data ?? [])).catch(() => {});
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30_000);
    return () => clearInterval(interval);
  }, []);

  const marcarLeida = async (id: number) => {
    await api.patch(`/notificaciones/${id}/leida`);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
  };

  const noLeidas = notifs.filter((n) => !n.leida).length;

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} size="small">
        <Badge badgeContent={noLeidas} color="error">
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 340, maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontWeight={700}>Notificaciones</Typography>
            {noLeidas > 0 && (
              <Button size="small" onClick={() => notifs.filter((n) => !n.leida).forEach((n) => marcarLeida(n.id))}>
                Marcar todas leídas
              </Button>
            )}
          </Box>
          <Divider />
          <List dense disablePadding>
            {notifs.length === 0 && (
              <ListItem>
                <ListItemText secondary="Sin notificaciones" />
              </ListItem>
            )}
            {notifs.map((n) => (
              <ListItem
                key={n.id}
                sx={{ bgcolor: n.leida ? 'transparent' : '#EFF6FF', alignItems: 'flex-start' }}
                secondaryAction={
                  !n.leida && (
                    <Button size="small" onClick={() => marcarLeida(n.id)}>✓</Button>
                  )
                }
              >
                <ListItemText
                  primary={n.titulo}
                  secondary={
                    <>
                      <span>{n.mensaje}</span>
                      <br />
                      <small style={{ color: '#9CA3AF' }}>{n.fechaCreacion?.slice(0, 16)}</small>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
}
