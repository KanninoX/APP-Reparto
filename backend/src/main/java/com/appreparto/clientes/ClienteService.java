package com.appreparto.clientes;

import com.appreparto.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
    }

    public Cliente crear(Cliente cliente) {
        if (clienteRepository.existsByRut(cliente.getRut())) {
            throw new IllegalArgumentException("Ya existe un cliente con el RUT: " + cliente.getRut());
        }
        return clienteRepository.save(cliente);
    }

    public Cliente actualizar(Long id, Cliente datos) {
        Cliente cliente = buscarPorId(id);
        cliente.setNombre(datos.getNombre());
        cliente.setDireccion(datos.getDireccion());
        cliente.setTelefono(datos.getTelefono());
        cliente.setEmail(datos.getEmail());
        cliente.setLatitud(datos.getLatitud());
        cliente.setLongitud(datos.getLongitud());
        return clienteRepository.save(cliente);
    }

    public void eliminar(Long id) {
        buscarPorId(id);
        clienteRepository.deleteById(id);
    }
}
