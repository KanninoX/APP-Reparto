package com.appreparto.rutas;

import com.appreparto.common.exception.ResourceNotFoundException;
import com.appreparto.pedidos.Pedido;
import com.appreparto.pedidos.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RutaService {

    private final RutaRepository rutaRepository;
    private final PedidoService pedidoService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Ruta> listarTodas() {
        return rutaRepository.findAll();
    }

    public Ruta buscarPorId(Long id) {
        return rutaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ruta", id));
    }

    public Ruta buscarRutaActivaDelOperario(Long usuarioId) {
        return rutaRepository.findByUsuarioIdAndEstado(usuarioId, Ruta.Estado.EN_CURSO)
                .orElseThrow(() -> new ResourceNotFoundException("No hay ruta activa para el operario"));
    }

    @Transactional
    public Ruta crear(Ruta ruta) {
        return rutaRepository.save(ruta);
    }

    @Transactional
    public Ruta reordenarPedidos(Long rutaId, List<Long> pedidoIdsOrdenados) {
        Ruta ruta = buscarPorId(rutaId);
        ruta.getRutaPedidos().forEach(rp -> {
            int nuevoOrden = pedidoIdsOrdenados.indexOf(rp.getPedido().getId());
            if (nuevoOrden >= 0) rp.setOrdenEntrega(nuevoOrden);
        });
        return rutaRepository.save(ruta);
    }

    @Transactional
    public Ruta agregarPedido(Long rutaId, Long pedidoId) {
        Ruta ruta = buscarPorId(rutaId);
        Pedido pedido = pedidoService.buscarPorId(pedidoId);
        int siguienteOrden = ruta.getRutaPedidos().size();
        RutaPedido rutaPedido = RutaPedido.builder()
                .ruta(ruta)
                .pedido(pedido)
                .ordenEntrega(siguienteOrden)
                .build();
        ruta.getRutaPedidos().add(rutaPedido);
        pedidoService.cambiarEstado(pedidoId, Pedido.Estado.ASIGNADO);
        Ruta guardada = rutaRepository.save(ruta);
        // Notificar al operario en tiempo real si la ruta ya está en curso
        if (ruta.getEstado() == Ruta.Estado.EN_CURSO) {
            messagingTemplate.convertAndSend(
                    "/topic/ruta/" + ruta.getUsuario().getId(), guardada);
        }
        return guardada;
    }
}
