package com.appreparto.vehiculos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    List<Vehiculo> findByActivoTrue();
    boolean existsByPatente(String patente);
    boolean existsByCodigo(String codigo);
}
