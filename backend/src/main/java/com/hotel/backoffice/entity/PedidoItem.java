package com.hotel.backoffice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "pedido_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PedidoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private Integer cantidad;

    // Precio congelado al momento del pedido: aunque el menú cambie
    // de precio después, el pedido se cobra con lo acordado.
    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    public BigDecimal calcularSubtotal() {
        BigDecimal cant = BigDecimal.valueOf(cantidad != null ? cantidad : 0);
        BigDecimal prec = precioUnitario != null ? precioUnitario : BigDecimal.ZERO;
        return cant.multiply(prec).setScale(2, RoundingMode.HALF_UP);
    }
}