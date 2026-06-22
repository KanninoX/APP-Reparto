package com.appreparto.pedidos;

import com.appreparto.clientes.ClienteService;
import com.appreparto.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteService clienteService;
    private final ApplicationEventPublisher eventPublisher;

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public List<Pedido> listarPorEstado(Pedido.Estado estado) {
        return pedidoRepository.findByEstado(estado);
    }

    public Pedido buscarPorId(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
    }

    @Transactional
    public Pedido crear(Pedido pedido) {
        clienteService.buscarPorId(pedido.getCliente().getId());
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido cambiarEstado(Long id, Pedido.Estado nuevoEstado) {
        Pedido pedido = buscarPorId(id);
        pedido.setEstado(nuevoEstado);
        Pedido guardado = pedidoRepository.save(pedido);
        eventPublisher.publishEvent(new PedidoEstadoCambiadoEvent(this, guardado));
        return guardado;
    }
}
