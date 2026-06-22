package com.appreparto.dispositivos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DispositivoRepository extends JpaRepository<Dispositivo, Long> {
    Optional<Dispositivo> findByDeviceIdAndUsuarioId(String deviceId, Long usuarioId);
    List<Dispositivo> findByAutorizadoFalse();
}
