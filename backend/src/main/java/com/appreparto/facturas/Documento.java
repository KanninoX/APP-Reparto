package com.appreparto.facturas;

import com.appreparto.pedidos.Pedido;
import com.appreparto.usuarios.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documentos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private Tipo tipo;

    @Column(name = "url_s3", nullable = false, length = 500)
    private String urlS3;

    @Column(name = "fecha_subida", nullable = false)
    @Builder.Default
    private LocalDateTime fechaSubida = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    public enum Tipo {
        FOTO_FACTURA, FOTO_EVIDENCIA, DOCUMENTO_ADJUNTO
    }
}
