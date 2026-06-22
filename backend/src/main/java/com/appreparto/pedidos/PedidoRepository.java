package com.appreparto.pedidos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByEstado(Pedido.Estado estado);
    List<Pedido> findByClienteId(Long clienteId);
    List<Pedido> findByVehiculoId(Long vehiculoId);
    List<Pedido> findByUsuarioId(Long usuarioId);
}
