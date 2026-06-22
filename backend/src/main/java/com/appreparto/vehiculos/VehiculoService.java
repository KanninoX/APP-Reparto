package com.appreparto.vehiculos;

import com.appreparto.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;

    public List<Vehiculo> listarActivos() {
        return vehiculoRepository.findByActivoTrue();
    }

    public List<Vehiculo> listarTodos() {
        return vehiculoRepository.findAll();
    }

    public Vehiculo buscarPorId(Long id) {
        return vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", id));
    }

    public Vehiculo crear(Vehiculo vehiculo) {
        if (vehiculoRepository.existsByPatente(vehiculo.getPatente())) {
            throw new IllegalArgumentException("Ya existe un vehículo con la patente: " + vehiculo.getPatente());
        }
        if (vehiculoRepository.existsByCodigo(vehiculo.getCodigo())) {
            throw new IllegalArgumentException("Ya existe un vehículo con el código: " + vehiculo.getCodigo());
        }
        return vehiculoRepository.save(vehiculo);
    }

    public Vehiculo actualizar(Long id, Vehiculo datos) {
        Vehiculo v = buscarPorId(id);
        v.setTipo(datos.getTipo());
        v.setCapacidadKg(datos.getCapacidadKg());
        return vehiculoRepository.save(v);
    }

    public Vehiculo cambiarActivo(Long id, boolean activo) {
        Vehiculo v = buscarPorId(id);
        v.setActivo(activo);
        return vehiculoRepository.save(v);
    }
}
