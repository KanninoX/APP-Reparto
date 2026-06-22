package com.appreparto.dispositivos;

import com.appreparto.common.exception.ResourceNotFoundException;
import com.appreparto.usuarios.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DispositivoService {

    private final DispositivoRepository dispositivoRepository;

    public Optional<Dispositivo> buscar(String deviceId, Long usuarioId) {
        return dispositivoRepository.findByDeviceIdAndUsuarioId(deviceId, usuarioId);
    }

    @Transactional
    public Dispositivo registrarPendiente(String deviceId, Usuario usuario) {
        return dispositivoRepository.save(
                Dispositivo.builder()
                        .deviceId(deviceId)
                        .usuario(usuario)
                        .autorizado(false)
                        .build());
    }

    public List<Dispositivo> listarPendientes() {
        return dispositivoRepository.findByAutorizadoFalse();
    }

    @Transactional
    public Dispositivo autorizar(Long id) {
        Dispositivo d = dispositivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo", id));
        d.setAutorizado(true);
        return dispositivoRepository.save(d);
    }

    @Transactional
    public void rechazar(Long id) {
        dispositivoRepository.deleteById(id);
    }
}
