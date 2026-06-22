package com.appreparto.facturas;

import com.appreparto.common.dto.ApiResponse;
import com.appreparto.pedidos.Pedido;
import com.appreparto.pedidos.PedidoService;
import com.appreparto.usuarios.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoRepository documentoRepository;
    private final PedidoService pedidoService;
    private final S3Service s3Service;

    @PostMapping("/subir")
    @PreAuthorize("hasAnyRole('OPERARIO','EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Documento>> subir(
            @RequestParam MultipartFile archivo,
            @RequestParam Long pedidoId,
            @RequestParam Documento.Tipo tipo,
            @AuthenticationPrincipal Usuario usuario) {
        Pedido pedido = pedidoService.buscarPorId(pedidoId);
        String url = s3Service.subirArchivo(archivo, "pedidos/" + pedidoId);
        Documento doc = Documento.builder()
                .pedido(pedido)
                .tipo(tipo)
                .urlS3(url)
                .usuario(usuario)
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Documento subido", documentoRepository.save(doc)));
    }

    @GetMapping("/pedido/{pedidoId}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN','OPERARIO')")
    public ResponseEntity<ApiResponse<List<Documento>>> listarPorPedido(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(ApiResponse.ok(documentoRepository.findByPedidoId(pedidoId)));
    }
}
