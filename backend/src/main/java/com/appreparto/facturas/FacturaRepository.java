package com.appreparto.facturas;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {
    Optional<Factura> findByPedidoId(Long pedidoId);
    List<Factura> findByEstado(Factura.Estado estado);
    boolean existsByNumeroFactura(String numeroFactura);
}
