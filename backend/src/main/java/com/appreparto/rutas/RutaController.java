package com.appreparto.rutas;

import com.appreparto.common.dto.ApiResponse;
import com.appreparto.usuarios.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rutas")
@RequiredArgsConstructor
public class RutaController {

    private final RutaService rutaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<List<Ruta>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(rutaService.listarTodas()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN','OPERARIO')")
    public ResponseEntity<ApiResponse<Ruta>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(rutaService.buscarPorId(id)));
    }

    @GetMapping("/mi-ruta")
    @PreAuthorize("hasRole('OPERARIO')")
    public ResponseEntity<ApiResponse<Ruta>> miRuta(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(ApiResponse.ok(rutaService.buscarRutaActivaDelOperario(usuario.getId())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Ruta>> crear(@RequestBody Ruta ruta) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Ruta creada", rutaService.crear(ruta)));
    }

    @PutMapping("/{id}/reordenar")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Ruta>> reordenar(
            @PathVariable Long id,
            @RequestBody List<Long> pedidoIdsOrdenados) {
        return ResponseEntity.ok(ApiResponse.ok(rutaService.reordenarPedidos(id, pedidoIdsOrdenados)));
    }

    @PostMapping("/{rutaId}/pedidos/{pedidoId}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Ruta>> agregarPedido(
            @PathVariable Long rutaId,
            @PathVariable Long pedidoId) {
        return ResponseEntity.ok(ApiResponse.ok(rutaService.agregarPedido(rutaId, pedidoId)));
    }
}
