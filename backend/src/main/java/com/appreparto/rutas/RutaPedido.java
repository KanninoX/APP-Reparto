package com.appreparto.rutas;

import com.appreparto.pedidos.Pedido;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ruta_pedidos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = {"ruta", "pedido"})
public class RutaPedido {

    @EmbeddedId
    private RutaPedidoId id = new RutaPedidoId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("rutaId")
    @JoinColumn(name = "ruta_id")
    private Ruta ruta;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("pedidoId")
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @Column(name = "orden_entrega", nullable = false)
    private Integer ordenEntrega;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RutaPedidoId implements java.io.Serializable {
        private Long rutaId;
        private Long pedidoId;
    }
}
