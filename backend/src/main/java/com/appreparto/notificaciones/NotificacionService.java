package com.appreparto.notificaciones;

import com.appreparto.pedidos.PedidoEstadoCambiadoEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final EmailService emailService;
    @SuppressWarnings("unused") // Se activa en Sprint 6 para notificaciones SMS a clientes
    private final SmsService smsService;

    public List<Notificacion> listarPorUsuario(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId);
    }

    public void marcarLeida(Long id) {
        notificacionRepository.findById(id).ifPresent(n -> {
            n.setLeida(true);
            notificacionRepository.save(n);
        });
    }

    // Reacciona automáticamente cuando un pedido cambia de estado
    @EventListener
    public void onPedidoEstadoCambiado(PedidoEstadoCambiadoEvent event) {
        var pedido = event.getPedido();
        if (pedido.getEstado().name().equals("EN_RUTA") && pedido.getCliente().getEmail() != null) {
            String mensaje = "Su pedido #" + pedido.getId() + " ya está en camino. Dirección: " + pedido.getDireccionEntrega();
            emailService.enviar(pedido.getCliente().getEmail(), "Pedido en camino", mensaje);
            log.info("Notificación email enviada por pedido {} -> EN_RUTA", pedido.getId());
        }
    }
}
