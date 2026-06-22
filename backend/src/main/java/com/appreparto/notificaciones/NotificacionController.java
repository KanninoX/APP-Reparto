package com.appreparto.notificaciones;

import com.appreparto.common.dto.ApiResponse;
import com.appreparto.usuarios.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notificacion>>> listar(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(ApiResponse.ok(notificacionService.listarPorUsuario(usuario.getId())));
    }

    @PatchMapping("/{id}/leida")
    public ResponseEntity<ApiResponse<Void>> marcarLeida(@PathVariable Long id) {
        notificacionService.marcarLeida(id);
        return ResponseEntity.ok(ApiResponse.ok("Notificación marcada como leída", null));
    }
}
