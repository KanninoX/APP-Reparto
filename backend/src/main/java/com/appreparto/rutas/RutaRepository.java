package com.appreparto.rutas;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RutaRepository extends JpaRepository<Ruta, Long> {
    List<Ruta> findByEstado(Ruta.Estado estado);
    Optional<Ruta> findByUsuarioIdAndEstado(Long usuarioId, Ruta.Estado estado);
}
