package com.appreparto.usuarios;

import com.appreparto.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Usuario>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.listarTodos()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Usuario>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.buscarPorId(id)));
    }

    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Usuario>> cambiarActivo(
            @PathVariable Long id,
            @RequestParam boolean activo) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.actualizarActivo(id, activo)));
    }
}
