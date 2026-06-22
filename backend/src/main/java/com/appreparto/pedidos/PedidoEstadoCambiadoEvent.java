package com.appreparto.pedidos;

import org.springframework.context.ApplicationEvent;

public class PedidoEstadoCambiadoEvent extends ApplicationEvent {

    private final Pedido pedido;

    public PedidoEstadoCambiadoEvent(Object source, Pedido pedido) {
        super(source);
        this.pedido = pedido;
    }

    public Pedido getPedido() {
        return pedido;
    }
}
