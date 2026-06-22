package com.appreparto.pedidos;

import com.appreparto.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<List<Pedido>>> listar(
            @RequestParam(required = false) Pedido.Estado estado) {
        List<Pedido> pedidos = estado != null
                ? pedidoService.listarPorEstado(estado)
                : pedidoService.listarTodos();
        return ResponseEntity.ok(ApiResponse.ok(pedidos));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN','OPERARIO')")
    public ResponseEntity<ApiResponse<Pedido>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(pedidoService.buscarPorId(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Pedido>> crear(@RequestBody Pedido pedido) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Pedido creado", pedidoService.crear(pedido)));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN','OPERARIO')")
    public ResponseEntity<ApiResponse<Pedido>> cambiarEstado(
            @PathVariable Long id,
            @RequestParam Pedido.Estado estado,
            @RequestParam(required = false) String motivoRechazo,
            @RequestParam(required = false, defaultValue = "false") boolean reagendar) {
        return ResponseEntity.ok(ApiResponse.ok(
                pedidoService.cambiarEstado(id, estado, motivoRechazo, reagendar)));
    }
}
