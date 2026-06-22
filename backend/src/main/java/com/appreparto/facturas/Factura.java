package com.appreparto.facturas;

import com.appreparto.pedidos.Pedido;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "facturas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Column(name = "numero_factura", nullable = false, unique = true, length = 30)
    private String numeroFactura;

    @Column(name = "monto_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "fecha_emision", nullable = false)
    @Builder.Default
    private LocalDate fechaEmision = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private Estado estado = Estado.PENDIENTE;

    @Column(name = "url_pdf_s3", length = 500)
    private String urlPdfS3;

    public enum Estado {
        PENDIENTE, PAGADA, VENCIDA, ANULADA
    }
}
