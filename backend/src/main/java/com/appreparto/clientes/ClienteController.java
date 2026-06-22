package com.appreparto.clientes;

import com.appreparto.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<List<Cliente>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(clienteService.listarTodos()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Cliente>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(clienteService.buscarPorId(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Cliente>> crear(@Valid @RequestBody Cliente cliente) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cliente creado", clienteService.crear(cliente)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Cliente>> actualizar(@PathVariable Long id,
                                                           @Valid @RequestBody Cliente cliente) {
        return ResponseEntity.ok(ApiResponse.ok(clienteService.actualizar(id, cliente)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok("Cliente eliminado", null));
    }
}
