package com.appreparto.usuarios;

import com.appreparto.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
    }

    public Usuario crear(String nombre, String email, String password, Usuario.Rol rol) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + email);
        }
        Usuario usuario = Usuario.builder()
                .nombre(nombre)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .rol(rol)
                .build();
        return usuarioRepository.save(usuario);
    }

    public Usuario actualizarActivo(Long id, boolean activo) {
        Usuario usuario = buscarPorId(id);
        usuario.setActivo(activo);
        return usuarioRepository.save(usuario);
    }
}
